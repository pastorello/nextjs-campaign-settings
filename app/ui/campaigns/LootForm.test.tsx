import { fireEvent, render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const createLoot = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/createLoot", () => ({
  default: (...args: unknown[]) => createLoot(...args),
}));

const updateLoot = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/updateLoot", () => ({
  default: (...args: unknown[]) => updateLoot(...args),
}));

import LootForm from "./LootForm";

const magicItemOptions = [{ value: 21, label: "Cloak of Elvenkind" }];
const treasureOptions = [{ value: 42, label: "Silver Tharun" }];

// Headless UI's Listbox measures itself with ResizeObserver on selection,
// which jsdom does not implement — same gap and same fix as
// `SortableHeader.test.tsx`. This suite actually chooses an option.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

describe("LootForm (SPEC-013 T8)", () => {
  const onCancel = vi.fn();
  const onSaved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("converts a value entered in gold to stored silver", async () => {
    createLoot.mockResolvedValue({ ok: true });
    render(
      <LootForm
        sceneId={9}
        nextPosition={1}
        currencyUnit="gold"
        magicItemOptions={[]}
        treasureOptions={[]}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );

    fireEvent.change(screen.getByLabelText("loot.fields.description.label"), {
      target: { value: "A silver coin" },
    });
    fireEvent.change(screen.getByLabelText(/loot.fields.value.label/), {
      target: { value: "3" },
    });
    fireEvent.click(screen.getByText("loot.form.createButton"));

    await vi.waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(createLoot).toHaveBeenCalledWith(
      expect.objectContaining({
        sceneId: 9,
        description: "A silver coin",
        value: 30,
        magicItemId: null,
        treasureId: null,
      })
    );
  });

  it("clears the treasure link when a magic item is picked, client-side", () => {
    render(
      <LootForm
        sceneId={9}
        nextPosition={1}
        currencyUnit="silver"
        magicItemOptions={magicItemOptions}
        treasureOptions={treasureOptions}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );

    const selects = screen.getAllByTestId("form-select");
    // Field order: magicItemId, then treasureId.
    fireEvent.click(within(selects[1]!).getByRole("button"));
    fireEvent.click(screen.getByText("Silver Tharun"));

    fireEvent.click(within(selects[0]!).getByRole("button"));
    fireEvent.click(screen.getByText("Cloak of Elvenkind"));

    // The treasure select's own button now reads its "not linked" option.
    expect(
      within(selects[1]!).getByText("loot.fields.treasureId.noneOption")
    ).toBeInTheDocument();
  });

  it("surfaces the server's mutual-exclusion rejection", async () => {
    createLoot.mockResolvedValue({
      ok: false,
      errors: {
        treasureId: [
          "A loot row cannot link to both a magic item and a catalogue treasure.",
        ],
      },
    });
    render(
      <LootForm
        sceneId={9}
        nextPosition={1}
        currencyUnit="silver"
        magicItemOptions={[]}
        treasureOptions={[]}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );

    fireEvent.click(screen.getByText("loot.form.createButton"));

    await vi.waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent(/cannot link to both/)
    );
    expect(onSaved).not.toHaveBeenCalled();
  });
});

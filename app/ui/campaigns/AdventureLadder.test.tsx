import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import AdventureStatus from "@/app/lib/definitions/enums/campaign/AdventureStatus";

vi.mock("next-intl", () => ({
  useTranslations:
    (namespace?: string) => (key: string, values?: Record<string, unknown>) => {
      const full = namespace ? `${namespace}.${key}` : key;
      return values ? `${full} ${JSON.stringify(values)}` : full;
    },
}));

const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const updateAdventure = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/updateAdventure", () => ({
  default: (...args: unknown[]) => updateAdventure(...args),
}));

const reorderAdventures = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/reorderAdventures", () => ({
  default: (...args: unknown[]) => reorderAdventures(...args),
}));

const deleteAdventureById = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/deleteAdventureById", () => ({
  default: (...args: unknown[]) => deleteAdventureById(...args),
}));

const notifySuccess = vi.fn<(...args: unknown[]) => void>();
const notifyError = vi.fn<(...args: unknown[]) => void>();
vi.mock("@/app/lib/notifications/notify", () => ({
  notifySuccess: (...args: unknown[]) => notifySuccess(...args),
  notifyError: (...args: unknown[]) => notifyError(...args),
}));

vi.mock("./AdventureForm", () => ({
  default: ({ onSaved }: { onSaved: () => void }) => (
    <button onClick={onSaved} data-testid="adventure-form">
      save-stub
    </button>
  ),
}));

import AdventureLadder from "./AdventureLadder";

const adventureA = {
  id: 10,
  campaignId: 1,
  position: 1,
  targetLevel: 3,
  title: "Into the Mire",
  synopsis: null,
  timeline: null,
  status: AdventureStatus.Active,
  xpTarget: null,
  currencyTarget: null,
  currencyUnit: null,
  permanentItemTarget: null,
  consumableTarget: null,
};

const adventureB = {
  ...adventureA,
  id: 11,
  position: 2,
  title: "The Sunken Keep",
  status: AdventureStatus.Planned,
};

describe("AdventureLadder (SPEC-013 T7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders adventures in the given (position) order", () => {
    render(
      <AdventureLadder
        campaignId={1}
        adventures={[adventureA, adventureB]}
        progress={{}}
      />
    );

    const titles = screen.getAllByRole("row").map((row) => row.textContent);
    const mireIndex = titles.findIndex((text) =>
      text?.includes("Into the Mire")
    );
    const keepIndex = titles.findIndex((text) =>
      text?.includes("The Sunken Keep")
    );

    expect(mireIndex).toBeGreaterThan(-1);
    expect(mireIndex).toBeLessThan(keepIndex);
  });

  it("shows the empty message and no table when there are no adventures", () => {
    render(<AdventureLadder campaignId={1} adventures={[]} progress={{}} />);

    expect(
      screen.getByText("adventure.ladder.emptyMessage")
    ).toBeInTheDocument();
    expect(screen.queryByRole("table")).not.toBeInTheDocument();
  });

  it("disables moving the first adventure up and the last one down", () => {
    render(
      <AdventureLadder
        campaignId={1}
        adventures={[adventureA, adventureB]}
        progress={{}}
      />
    );

    const upButtons = screen.getAllByLabelText(/moveUp/);
    const downButtons = screen.getAllByLabelText(/moveDown/);

    expect(upButtons[0]).toBeDisabled();
    expect(downButtons[downButtons.length - 1]).toBeDisabled();
  });

  it("reorders by swapping with the next adventure and refreshes", async () => {
    reorderAdventures.mockResolvedValue({ ok: true });
    render(
      <AdventureLadder
        campaignId={1}
        adventures={[adventureA, adventureB]}
        progress={{}}
      />
    );

    fireEvent.click(screen.getAllByLabelText(/moveDown/)[0]!);

    await waitFor(() =>
      expect(reorderAdventures).toHaveBeenCalledWith(1, [11, 10])
    );
    expect(refresh).toHaveBeenCalled();
  });

  it("deletes an adventure after confirmation and refreshes", async () => {
    deleteAdventureById.mockResolvedValue(undefined);
    render(
      <AdventureLadder campaignId={1} adventures={[adventureA]} progress={{}} />
    );

    fireEvent.click(screen.getByText("common.form.delete"));
    const dialog = screen.getByRole("dialog");
    fireEvent.click(within(dialog).getByText("common.form.delete"));

    await waitFor(() => expect(deleteAdventureById).toHaveBeenCalledWith(10));
    expect(refresh).toHaveBeenCalled();
  });

  it("shows and hides the add-adventure form", () => {
    render(<AdventureLadder campaignId={1} adventures={[]} progress={{}} />);

    expect(screen.queryByTestId("adventure-form")).not.toBeInTheDocument();

    fireEvent.click(screen.getByText("adventure.ladder.addButton"));
    expect(screen.getByTestId("adventure-form")).toBeInTheDocument();

    fireEvent.click(screen.getByTestId("adventure-form"));
    expect(screen.queryByTestId("adventure-form")).not.toBeInTheDocument();
  });
});

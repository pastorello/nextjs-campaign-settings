import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const createAdventure = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/createAdventure", () => ({
  default: (...args: unknown[]) => createAdventure(...args),
}));

import AdventureForm from "./AdventureForm";

function fillTitle(value: string) {
  fireEvent.change(screen.getByLabelText("adventure.fields.title.label"), {
    target: { value },
  });
}

describe("AdventureForm (SPEC-013 T7)", () => {
  const onCancel = vi.fn();
  const onSaved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("defaults position to the next free slot on the ladder", () => {
    render(
      <AdventureForm
        campaignId={1}
        nextPosition={3}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );

    expect(
      screen.getByLabelText("adventure.fields.position.label")
    ).toHaveValue("3");
  });

  it("creates a planned adventure on the given campaign and reports back", async () => {
    createAdventure.mockResolvedValue({ ok: true });
    render(
      <AdventureForm
        campaignId={1}
        nextPosition={1}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );

    fillTitle("Into the Mire");
    fireEvent.click(screen.getByText("adventure.form.createButton"));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(createAdventure).toHaveBeenCalledWith(
      expect.objectContaining({
        campaignId: 1,
        position: 1,
        title: "Into the Mire",
        status: "planned",
      })
    );
    expect(onSaved).toHaveBeenCalled();
  });

  it("shows field errors and does not report success when rejected", async () => {
    createAdventure.mockResolvedValue({
      ok: false,
      errors: { title: ["Required"] },
    });
    render(
      <AdventureForm
        campaignId={1}
        nextPosition={1}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );

    fireEvent.click(screen.getByText("adventure.form.createButton"));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Required")
    );
    expect(onSaved).not.toHaveBeenCalled();
    expect(refresh).not.toHaveBeenCalled();
  });

  it("calls onCancel when cancelled", () => {
    render(
      <AdventureForm
        campaignId={1}
        nextPosition={1}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );

    fireEvent.click(screen.getByText("common.form.cancel"));

    expect(onCancel).toHaveBeenCalled();
  });
});

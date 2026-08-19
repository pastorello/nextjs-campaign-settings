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
  useTranslations: () => (key: string) => key,
}));

const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

const updateAdventure = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/campaigns/updateAdventure", () => ({
  default: (...args: unknown[]) => updateAdventure(...args),
}));

import AdventureInfoForm from "./AdventureInfoForm";

// Headless UI's Listbox measures itself with ResizeObserver on selection,
// which jsdom does not implement — same gap and same fix as
// `SortableHeader.test.tsx`. The unit-switch test below actually picks an
// option.
global.ResizeObserver = class {
  observe() {}
  unobserve() {}
  disconnect() {}
};

const adventure = {
  id: 10,
  campaignId: 1,
  position: 1,
  targetLevel: 3,
  title: "Into the Mire",
  synopsis: "A poor coastline haunted by an old war.",
  timeline: null,
  status: AdventureStatus.Active,
  xpTarget: null,
  currencyTarget: 100,
  currencyUnit: "gold",
  permanentItemTarget: null,
  consumableTarget: null,
};

describe("AdventureInfoForm (SPEC-013 T8)", () => {
  const onCancel = vi.fn();
  const onSaved = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("displays the currency target converted to the adventure's unit", () => {
    render(
      <AdventureInfoForm
        adventure={adventure}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );

    expect(
      screen.getByLabelText("adventure.fields.currencyTarget.label")
    ).toHaveValue("10");
  });

  it("converts an edited currency target back to stored silver on save", async () => {
    updateAdventure.mockResolvedValue({ ok: true });
    render(
      <AdventureInfoForm
        adventure={adventure}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );

    fireEvent.change(
      screen.getByLabelText("adventure.fields.currencyTarget.label"),
      { target: { value: "15" } }
    );
    fireEvent.click(screen.getByText("adventure.form.editButton"));

    await waitFor(() => expect(refresh).toHaveBeenCalled());
    expect(updateAdventure).toHaveBeenCalledWith(
      expect.objectContaining({ id: 10, currencyTarget: 150 })
    );
    expect(onSaved).toHaveBeenCalled();
  });

  it("re-derives the displayed target on a unit switch, so the stored value survives unchanged", async () => {
    updateAdventure.mockResolvedValue({ ok: true });
    render(
      <AdventureInfoForm
        adventure={adventure}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );

    // Starts at 10 gold (100 stored silver). Switching to silver must
    // re-display it as 100, not leave "10" sitting there to be
    // misread as 10 silver (100 stored) on save.
    const unitSelect = screen.getAllByTestId("form-select")[0]!;
    fireEvent.click(within(unitSelect).getByRole("button"));
    fireEvent.click(screen.getByText("adventure.currencyUnits.silver"));

    expect(
      screen.getByLabelText("adventure.fields.currencyTarget.label")
    ).toHaveValue("100");

    fireEvent.click(screen.getByText("adventure.form.editButton"));

    await waitFor(() => expect(updateAdventure).toHaveBeenCalled());
    expect(updateAdventure).toHaveBeenCalledWith(
      expect.objectContaining({ currencyTarget: 100, currencyUnit: "silver" })
    );
  });

  it("does not touch position or status", async () => {
    updateAdventure.mockResolvedValue({ ok: true });
    render(
      <AdventureInfoForm
        adventure={adventure}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );

    fireEvent.click(screen.getByText("adventure.form.editButton"));

    await waitFor(() => expect(updateAdventure).toHaveBeenCalled());
    const payload = updateAdventure.mock.calls[0]![0] as Record<
      string,
      unknown
    >;
    expect(payload).not.toHaveProperty("position");
    expect(payload).not.toHaveProperty("status");
  });

  it("shows field errors and does not report success when rejected", async () => {
    updateAdventure.mockResolvedValue({
      ok: false,
      errors: { title: ["Required"] },
    });
    render(
      <AdventureInfoForm
        adventure={adventure}
        onCancel={onCancel}
        onSaved={onSaved}
      />
    );

    fireEvent.click(screen.getByText("adventure.form.editButton"));

    await waitFor(() =>
      expect(screen.getByRole("alert")).toHaveTextContent("Required")
    );
    expect(onSaved).not.toHaveBeenCalled();
  });
});

import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { universalCountFixture as universal } from "@/app/lib/calendar/dateSystemFixtures";
import CampaignEvent from "@/app/lib/definitions/interfaces/calendar/CampaignEvent";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import { ResolvedOption } from "@/app/lib/definitions/types/SelectOption";
import en from "@/messages/en.json";

vi.mock("next-intl", async () => await vi.importActual("next-intl"));

const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ refresh }) }));

const create =
  vi.fn<(campaignId: number, input: unknown) => Promise<MutationResult>>();
vi.mock("@/app/lib/data/calendar/createCampaignEvent", () => ({
  default: (campaignId: number, input: unknown) => create(campaignId, input),
}));
const update = vi.fn<(id: number, input: unknown) => Promise<MutationResult>>();
vi.mock("@/app/lib/data/calendar/updateCampaignEvent", () => ({
  default: (id: number, input: unknown) => update(id, input),
}));

vi.mock("@/app/lib/notifications/notify", () => ({ notifyError: vi.fn() }));

// The listbox is Headless UI's; a native select tests this form's logic.
vi.mock("@/app/ui/forms/inputs/Select", () => ({
  default: ({
    label,
    value,
    options = [],
    onChange,
  }: {
    label: string;
    value: number;
    options?: ResolvedOption[];
    onChange: (value: number) => void;
  }) => (
    <label>
      {label}
      <select
        value={String(value)}
        onChange={(e) => onChange(Number(e.target.value))}
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  ),
}));

import CampaignEventForm from "./CampaignEventForm";

const ownerOptions = {
  adventures: [
    { id: 10, name: "Into the Mire" },
    { id: 11, name: "The Drowned Keep" },
  ],
  scenes: [
    { id: 100, title: "The fog", adventureId: 10 },
    { id: 110, title: "The gate", adventureId: 11 },
  ],
};

function renderForm(event?: CampaignEvent) {
  const onSaved = vi.fn();
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <CampaignEventForm
        campaignId={1}
        systems={[universal]}
        displaySystemId={universal.id}
        ownerOptions={ownerOptions}
        event={event}
        onCancel={vi.fn()}
        onSaved={onSaved}
      />
    </NextIntlClientProvider>
  );
  return onSaved;
}

const optionTexts = (label: string) =>
  [...screen.getByLabelText<HTMLSelectElement>(label).options].map(
    (option) => option.textContent
  );

describe("CampaignEventForm (SPEC-014 T6)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("creates an event on the campaign with the chosen adventure and scene", async () => {
    create.mockResolvedValue({ ok: true });
    const onSaved = renderForm();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "The cult raises the tower" },
    });
    fireEvent.change(screen.getByLabelText("Year"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("Day"), { target: { value: "2" } });
    fireEvent.change(screen.getByLabelText("Adventure"), {
      target: { value: "10" },
    });
    fireEvent.change(screen.getByLabelText("Scene"), {
      target: { value: "100" },
    });
    fireEvent.click(screen.getByRole("button", { name: "Add event" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith(1, {
      title: "The cult raises the tower",
      description: null,
      startDay: 1,
      startHour: null,
      endDay: null,
      endHour: null,
      repeatsYearly: false,
      adventureId: 10,
      sceneId: 100,
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("offers every campaign scene, by adventure, until an adventure is chosen", () => {
    renderForm();

    expect(optionTexts("Scene")).toEqual([
      "No scene",
      "Into the Mire · The fog",
      "The Drowned Keep · The gate",
    ]);

    fireEvent.change(screen.getByLabelText("Adventure"), {
      target: { value: "11" },
    });
    expect(optionTexts("Scene")).toEqual(["No scene", "The gate"]);
  });

  it("drops a scene that is not in a newly chosen adventure", () => {
    renderForm();

    fireEvent.change(screen.getByLabelText("Scene"), {
      target: { value: "100" },
    });
    fireEvent.change(screen.getByLabelText("Adventure"), {
      target: { value: "11" },
    });

    expect(screen.getByLabelText<HTMLSelectElement>("Scene").value).toBe("-1");
  });

  it("edits an event, showing the server's refusal on the scene", async () => {
    update.mockResolvedValue({
      ok: false,
      errors: { sceneId: [{ key: "sceneNotInAdventure" }] },
    });
    const onSaved = renderForm({
      id: 5,
      title: "Siege",
      description: null,
      startDay: 30,
      startHour: 9,
      endDay: null,
      endHour: null,
      repeatsYearly: true,
      adventure: { id: 10, name: "Into the Mire" },
      scene: { id: 100, name: "The fog" },
    });

    fireEvent.click(screen.getByRole("button", { name: "Save event" }));

    expect(
      await screen.findAllByText(en.common.fieldErrors.sceneNotInAdventure, {
        exact: false,
      })
    ).not.toHaveLength(0);
    expect(update).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        startDay: 30,
        startHour: 9,
        repeatsYearly: true,
        adventureId: 10,
        sceneId: 100,
      })
    );
    expect(onSaved).not.toHaveBeenCalled();
  });
});

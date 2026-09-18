import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { NextIntlClientProvider } from "next-intl";
import { beforeEach, describe, expect, it, vi } from "vitest";

import {
  humanCountFixture as human,
  universalCountFixture as universal,
} from "@/app/lib/calendar/dateSystemFixtures";
import WorldHistoryEvent from "@/app/lib/definitions/interfaces/calendar/WorldHistoryEvent";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import en from "@/messages/en.json";

vi.mock("next-intl", async () => await vi.importActual("next-intl"));

const refresh = vi.fn();
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ refresh }) }));

const create = vi.fn<(input: unknown) => Promise<MutationResult>>();
vi.mock("@/app/lib/data/calendar/createWorldHistoryEvent", () => ({
  default: (input: unknown) => create(input),
}));
const update = vi.fn<(id: number, input: unknown) => Promise<MutationResult>>();
vi.mock("@/app/lib/data/calendar/updateWorldHistoryEvent", () => ({
  default: (id: number, input: unknown) => update(id, input),
}));

vi.mock("@/app/lib/notifications/notify", () => ({ notifyError: vi.fn() }));

import WorldHistoryEventForm from "./WorldHistoryEventForm";

const ANCHOR_DAY = human.anchorYear * 365;

function renderForm(event?: WorldHistoryEvent) {
  const onSaved = vi.fn();
  render(
    <NextIntlClientProvider locale="en" messages={en}>
      <WorldHistoryEventForm
        systems={[universal, human]}
        displaySystemId={human.id}
        linkOptions={{
          zones: [{ value: 9, label: "Kang" }],
          npcs: [],
          deities: [],
          factions: [],
        }}
        event={event}
        onCancel={vi.fn()}
        onSaved={onSaved}
      />
    </NextIntlClientProvider>
  );
  return onSaved;
}

describe("WorldHistoryEventForm (SPEC-014 T5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("creates an event from what was typed, in the displayed system", async () => {
    create.mockResolvedValue({ ok: true });
    const onSaved = renderForm();

    fireEvent.change(screen.getByLabelText("Title"), {
      target: { value: "The Cataclysm" },
    });
    fireEvent.change(screen.getByLabelText("Year"), { target: { value: "0" } });
    fireEvent.change(screen.getByLabelText("Day"), { target: { value: "4" } });
    fireEvent.click(screen.getByRole("button", { name: "Add event" }));

    await waitFor(() => expect(onSaved).toHaveBeenCalled());
    expect(create).toHaveBeenCalledWith({
      title: "The Cataclysm",
      description: null,
      startDay: ANCHOR_DAY + 3,
      startHour: null,
      endDay: null,
      endHour: null,
      repeatsYearly: false,
      zoneIds: [],
      npcIds: [],
      deityIds: [],
      factionIds: [],
    });
    expect(refresh).toHaveBeenCalled();
  });

  it("shows the end date only once the event is given one", () => {
    renderForm();

    expect(screen.getAllByLabelText("Year")).toHaveLength(1);
    fireEvent.click(
      screen.getByRole("checkbox", { name: "It has an end date" })
    );
    expect(screen.getAllByLabelText("Year")).toHaveLength(2);
  });

  it("shows the server's date refusal on the end date", async () => {
    update.mockResolvedValue({
      ok: false,
      errors: { endDay: [{ key: "endBeforeStart" }] },
    });
    const onSaved = renderForm({
      id: 5,
      title: "Siege",
      description: null,
      startDay: ANCHOR_DAY + 10,
      startHour: null,
      endDay: ANCHOR_DAY + 12,
      endHour: null,
      repeatsYearly: false,
      zones: [{ id: 9, name: "Kang" }],
      npcs: [],
      deities: [],
      factions: [],
    });

    fireEvent.click(screen.getByRole("button", { name: "Save event" }));

    const message = en.common.fieldErrors.endBeforeStart;
    expect(
      await screen.findAllByText(message, { exact: false })
    ).not.toHaveLength(0);
    expect(update).toHaveBeenCalledWith(
      5,
      expect.objectContaining({
        startDay: ANCHOR_DAY + 10,
        endDay: ANCHOR_DAY + 12,
        zoneIds: [9],
      })
    );
    expect(onSaved).not.toHaveBeenCalled();
  });
});

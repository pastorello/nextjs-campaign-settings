import CalendarEventBase from "@/app/lib/definitions/interfaces/calendar/CalendarEventBase";
import CalendarEventFieldsInput from "@/app/lib/definitions/interfaces/calendar/CalendarEventFieldsInput";
import WorldDateValue from "@/app/lib/definitions/interfaces/calendar/WorldDateValue";

/**
 * What an event form holds for the fields every event has (SPEC-014 §5.4)
 * while the DM types — `CalendarEventFields`' value. The end sits behind
 * `hasEnd`: `WorldDateInput` reports `null` both for "left blank" and "not
 * a real date yet", so an empty end could not be told from a mistyped one.
 */
export interface CalendarEventDraft {
  title: string;
  description: string;
  start: WorldDateValue;
  hasEnd: boolean;
  end: WorldDateValue;
  repeatsYearly: boolean;
}

/** The draft for editing `event`, or a blank one to create an event. */
export function draftFromEvent(
  event: CalendarEventBase | undefined
): CalendarEventDraft {
  return {
    title: event?.title ?? "",
    description: event?.description ?? "",
    start: {
      universalDay: event?.startDay ?? null,
      hour: event?.startHour ?? null,
    },
    hasEnd: event !== undefined && event.endDay !== null,
    end: {
      universalDay: event?.endDay ?? event?.startDay ?? null,
      hour: event?.endHour ?? null,
    },
    repeatsYearly: event?.repeatsYearly ?? false,
  };
}

/**
 * The draft as the actions take it: a blank description is `null`, and an
 * end the DM switched off is no end, whatever its inputs still hold.
 */
export function draftToInput(
  draft: CalendarEventDraft
): CalendarEventFieldsInput {
  return {
    title: draft.title,
    description: draft.description.trim() === "" ? null : draft.description,
    startDay: draft.start.universalDay,
    startHour: draft.start.hour,
    endDay: draft.hasEnd ? draft.end.universalDay : null,
    endHour: draft.hasEnd ? draft.end.hour : null,
    repeatsYearly: draft.repeatsYearly,
  };
}

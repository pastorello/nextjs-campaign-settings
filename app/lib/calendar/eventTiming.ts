import type EventTiming from "@/app/lib/definitions/types/EventTiming";
import { DAYS_PER_YEAR } from "./monthLengths";

/** What the timing of an event needs to know about it. */
export interface TimedEventDates {
  startDay: number;
  endDay: number | null;
  repeatsYearly: boolean;
}

/** One occurrence of an event: its first and last universal day. */
export interface EventOccurrence {
  startDay: number;
  endDay: number;
}

export interface TimedOccurrence extends EventOccurrence {
  timing: EventTiming;
}

/**
 * The occurrence of an event that counts on `today` (SPEC-014 §5.4): a
 * one-off event's own span; a yearly event's first occurrence that has not
 * ended before `today` — the one spanning today if there is one, else the
 * next. Every year is 365 days (no leap years), so a yearly event's
 * occurrences are exactly `DAYS_PER_YEAR` apart, and one that crosses the
 * year's end is carried whole into the next year.
 */
export function occurrenceFrom(
  event: TimedEventDates,
  today: number
): EventOccurrence {
  const length = (event.endDay ?? event.startDay) - event.startDay;
  const ownEnd = event.startDay + length;
  if (!event.repeatsYearly || ownEnd >= today) {
    return { startDay: event.startDay, endDay: ownEnd };
  }
  const yearsLater = Math.ceil((today - ownEnd) / DAYS_PER_YEAR);
  const startDay = event.startDay + yearsLater * DAYS_PER_YEAR;
  return { startDay, endDay: startDay + length };
}

/**
 * Where an event sits against a campaign's current day (SPEC-014 §5.5):
 * **past** if the occurrence that counts ended before today, **current** if
 * it spans today, **upcoming** if it starts after. With no current day set
 * nothing is marked (`null`). Days only: today has no hour, so an event
 * earlier on today's date is still current.
 *
 * Returns the occurrence too, so a yearly event can be shown on the date
 * it next happens rather than the year it was first held.
 */
export function eventTiming(
  event: TimedEventDates,
  today: number | null
): TimedOccurrence | null {
  if (today === null) return null;
  const occurrence = occurrenceFrom(event, today);
  const timing: EventTiming =
    occurrence.endDay < today
      ? "past"
      : occurrence.startDay <= today
        ? "current"
        : "upcoming";
  return { timing, ...occurrence };
}

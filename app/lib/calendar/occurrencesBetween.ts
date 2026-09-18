import { DAYS_PER_YEAR } from "./monthLengths";
import type { EventOccurrence } from "./eventTiming";
import type { GridEventDates } from "./MonthView";

/**
 * An event's occurrences that overlap a range of universal days, in order.
 * A one-off event has at most one: its own dates. A yearly event (§5.4)
 * recurs on the same day and month of every year from its start year on —
 * however long before the range it started — and never spans more than a
 * year, so each occurrence is its own dates moved by whole years.
 */
export function occurrencesBetween(
  event: Pick<GridEventDates, "startDay" | "endDay" | "repeatsYearly">,
  firstDay: number,
  lastDay: number
): EventOccurrence[] {
  const length = (event.endDay ?? event.startDay) - event.startDay;
  const ownEnd = event.startDay + length;
  if (!event.repeatsYearly) {
    return event.startDay <= lastDay && ownEnd >= firstDay
      ? [{ startDay: event.startDay, endDay: ownEnd }]
      : [];
  }
  const firstYear = Math.max(0, Math.ceil((firstDay - ownEnd) / DAYS_PER_YEAR));
  const lastYear = Math.floor((lastDay - event.startDay) / DAYS_PER_YEAR);
  const occurrences: EventOccurrence[] = [];
  for (let years = firstYear; years <= lastYear; years++) {
    const startDay = event.startDay + years * DAYS_PER_YEAR;
    occurrences.push({ startDay, endDay: startDay + length });
  }
  return occurrences;
}

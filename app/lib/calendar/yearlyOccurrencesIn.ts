import type { GridEventDates } from "./MonthView";
import { occurrencesBetween } from "./occurrencesBetween";

type Dated = Pick<GridEventDates, "startDay" | "endDay" | "repeatsYearly">;

/**
 * Each yearly event once per year it falls in `firstDay`–`lastDay`, dated
 * to that occurrence (SPEC-014 T9) — the list's counterpart of what
 * `buildMonthView` does for a month, through the same `occurrencesBetween`.
 * An event first held before the range still appears in it, which is what
 * the campaign calendar's list needs from world history ("the cult's
 * founding day" every year the campaign spans, not only the year it was
 * founded). A one-off event is kept as it is. The result is in start-day
 * order, a day's events in their original order.
 *
 * Only for read-only listings: every occurrence keeps the event's `id`, so
 * a caller keys them by id and start day.
 */
export function yearlyOccurrencesIn<Event extends Dated>(
  events: readonly Event[],
  firstDay: number,
  lastDay: number
): Event[] {
  return events
    .flatMap((event) =>
      event.repeatsYearly
        ? occurrencesBetween(event, firstDay, lastDay).map((occurrence) => ({
            ...event,
            startDay: occurrence.startDay,
            endDay: event.endDay === null ? null : occurrence.endDay,
          }))
        : [event]
    )
    .sort((a, b) => a.startDay - b.startDay);
}

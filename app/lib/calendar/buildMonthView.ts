import type CalendarMonth from "./CalendarMonth";
import { monthRange } from "./monthRange";
import { moonPhaseOf } from "./moonPhaseOf";
import type {
  GridEventDates,
  MonthDayEvent,
  MonthView,
  MonthViewDay,
} from "./MonthView";
import { occurrencesBetween } from "./occurrencesBetween";
import { DAYS_PER_WEEK, weekdayOf } from "./weekdayOf";
import { zodiacSignOf } from "./zodiacSignOf";

/**
 * Lays a month out for the grid (SPEC-014 §5.6, T7): each day with its
 * weekday, moon phase (none without a reference new moon, §5.3) and
 * zodiac sign, and the events on it. A multi-day event is placed on every
 * day it spans inside the month, marked where it continues from before or
 * after; a yearly event on its occurrence in this month's year, however
 * long ago it started (§5.4). Hours show where they belong: the start hour
 * on the first day, the end hour on the last.
 *
 * Weeks start at weekday 0 — the systems' first weekday name, since day 0
 * is the first weekday everywhere (§5.1) — so a month opens with as many
 * blanks as its first day's weekday.
 *
 * Pure: the caller reads only the events that can fall in the month.
 */
export function buildMonthView<Event extends GridEventDates>(
  month: CalendarMonth,
  events: readonly Event[],
  referenceNewMoonDay: number | null
): MonthView<Event> {
  const { firstDay, lastDay } = monthRange(month);
  const dayCount = lastDay - firstDay + 1;

  const onDays: { order: number; placement: MonthDayEvent<Event> }[][] =
    Array.from({ length: dayCount }, () => []);
  events.forEach((event, order) => {
    for (const occurrence of occurrencesBetween(event, firstDay, lastDay)) {
      const from = Math.max(occurrence.startDay, firstDay);
      const to = Math.min(occurrence.endDay, lastDay);
      for (let day = from; day <= to; day++) {
        const isFirst = day === occurrence.startDay;
        const isLast = day === occurrence.endDay;
        onDays[day - firstDay]?.push({
          order,
          placement: {
            event,
            occurrenceStartDay: occurrence.startDay,
            occurrenceEndDay: occurrence.endDay,
            continuesFromBefore: !isFirst,
            continuesAfter: !isLast,
            startHour: isFirst ? event.startHour : null,
            endHour: isLast && event.endDay !== null ? event.endHour : null,
          },
        });
      }
    }
  });

  const days: MonthViewDay<Event>[] = onDays.map((placements, index) => {
    const universalDay = firstDay + index;
    return {
      universalDay,
      day: index + 1,
      weekday: weekdayOf(universalDay),
      moonPhase: moonPhaseOf(universalDay, referenceNewMoonDay),
      zodiacSign: zodiacSignOf(universalDay),
      events: placements
        .sort(
          (a, b) =>
            a.placement.occurrenceStartDay - b.placement.occurrenceStartDay ||
            (a.placement.event.startHour ?? -1) -
              (b.placement.event.startHour ?? -1) ||
            a.order - b.order
        )
        .map(({ placement }) => placement),
    };
  });

  const leadingBlanks = weekdayOf(firstDay);
  const trailingBlanks =
    (DAYS_PER_WEEK - ((leadingBlanks + dayCount) % DAYS_PER_WEEK)) %
    DAYS_PER_WEEK;
  const cells: (MonthViewDay<Event> | null)[] = [
    ...Array.from({ length: leadingBlanks }, () => null),
    ...days,
    ...Array.from({ length: trailingBlanks }, () => null),
  ];
  const weeks: (MonthViewDay<Event> | null)[][] = [];
  for (let start = 0; start < cells.length; start += DAYS_PER_WEEK) {
    weeks.push(cells.slice(start, start + DAYS_PER_WEEK));
  }

  return {
    ...month,
    firstDay,
    lastDay,
    leadingBlanks,
    trailingBlanks,
    days,
    weeks,
  };
}

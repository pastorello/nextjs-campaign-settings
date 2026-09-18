import { Prisma } from "@/generated/prisma/client";

/**
 * The events that can appear in a range of universal days: those that
 * start on or before `lastDay` and end (or, a one-day event, start) on or
 * after `firstDay`.
 *
 * With `withEarlierYearly`, also every yearly event that started on or
 * before `lastDay` however long ago — its later occurrences may fall in the
 * range (SPEC-014 §5.4). The month grid wants those (T7) and places them
 * with `occurrencesBetween`; the lists, which show a yearly event once
 * where it starts, do not.
 */
export default function eventsInRangeWhere(
  firstDay: number,
  lastDay: number,
  withEarlierYearly = false
): Prisma.calendarEventWhereInput {
  return {
    startDay: { lte: lastDay },
    OR: [
      ...(withEarlierYearly ? [{ repeatsYearly: true }] : []),
      { endDay: { gte: firstDay } },
      { endDay: null, startDay: { gte: firstDay } },
    ],
  };
}

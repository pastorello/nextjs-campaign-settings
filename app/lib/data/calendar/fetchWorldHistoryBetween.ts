import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import CalendarEventBase from "@/app/lib/definitions/interfaces/calendar/CalendarEventBase";
import eventsInRangeWhere from "./eventsInRangeWhere";

/**
 * The world history events that fall inside a range of universal days
 * (SPEC-014 §5.4 — a campaign's calendar shows them beside its own, read
 * only): every campaign-less event that starts on or before `lastDay` and
 * ends (or, a one-day event, starts) on or after `firstDay`, in order of
 * start. Without their links — the campaign calendar shows them as
 * context, and editing them is the world history page's job.
 *
 * By default a yearly history event is matched on its own dates, like the
 * world history list, which lists it once where it starts. The month grid
 * (T7) passes `withEarlierYearly` to read every yearly event that started
 * by `lastDay` too, since its later occurrences may fall in the month.
 */
export default async function fetchWorldHistoryBetween(
  firstDay: number,
  lastDay: number,
  withEarlierYearly = false
): Promise<CalendarEventBase[]> {
  try {
    return await prisma.calendarEvent.findMany({
      where: {
        campaignId: null,
        ...eventsInRangeWhere(firstDay, lastDay, withEarlierYearly),
      },
      orderBy: [
        { startDay: "asc" },
        { startHour: { sort: "asc", nulls: "first" } },
        { id: "asc" },
      ],
      select: {
        id: true,
        title: true,
        description: true,
        startDay: true,
        startHour: true,
        endDay: true,
        endHour: true,
        repeatsYearly: true,
      },
    });
  } catch (error) {
    throw toDatabaseError("fetching world history in a range", error);
  }
}

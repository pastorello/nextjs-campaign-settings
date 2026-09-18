import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import CampaignEvent from "@/app/lib/definitions/interfaces/calendar/CampaignEvent";
import eventsInRangeWhere from "./eventsInRangeWhere";

/**
 * A campaign's events (SPEC-014 §5.4/§5.6, T6), in order of start — a
 * day's untimed events first, as world history orders them — with the
 * adventure and scene each names, by title. Filtered to one adventure when
 * `adventureId` is set (the calendar's adventure filter).
 *
 * Not paged: a campaign plans weeks or months of in-world time, not the
 * world's millennia, and the campaign page needs every event to find the
 * next three upcoming ones — a yearly event's next occurrence is not where
 * it sorts. The month grid (T7) passes a `range` — its month — and reads
 * only the events that can appear in it, yearly ones that started earlier
 * included.
 */
export default async function fetchCampaignEvents(
  campaignId: number,
  adventureId: number | null = null,
  range?: { firstDay: number; lastDay: number }
): Promise<CampaignEvent[]> {
  let rows;
  try {
    rows = await prisma.calendarEvent.findMany({
      where: {
        campaignId,
        ...(adventureId !== null && { adventureId }),
        ...(range && eventsInRangeWhere(range.firstDay, range.lastDay, true)),
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
        adventure: { select: { id: true, title: true } },
        scene: { select: { id: true, title: true } },
      },
    });
  } catch (error) {
    throw toDatabaseError("fetching the campaign's events", error);
  }

  return rows.map(({ adventure, scene, ...event }) => ({
    ...event,
    adventure: adventure && { id: adventure.id, name: adventure.title },
    scene: scene && { id: scene.id, name: scene.title },
  }));
}

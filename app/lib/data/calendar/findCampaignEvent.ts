import prisma from "@/app/lib/connections/prisma";
import NotFoundError from "@/app/lib/errors/NotFoundError";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import isPositiveId from "@/app/lib/utils/isPositiveId";

/**
 * Confirms `id` names a campaign event before an edit or delete (SPEC-014
 * §5.4, T6) and returns its campaign. An id that is not a positive whole
 * number, or a world history event, is refused as not found — the mirror
 * of `findWorldHistoryEvent`, so neither page can touch the other's rows.
 */
export default async function findCampaignEvent(
  id: unknown
): Promise<{ id: number; campaignId: number }> {
  if (!isPositiveId(id)) throw new NotFoundError("Campaign event", String(id));

  let event;
  try {
    event = await prisma.calendarEvent.findUnique({
      where: { id },
      select: { campaignId: true },
    });
  } catch (error) {
    throw toDatabaseError("looking up campaign event", error);
  }

  if (!event || event.campaignId === null) {
    throw new NotFoundError("Campaign event", id);
  }
  return { id, campaignId: event.campaignId };
}

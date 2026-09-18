import prisma from "@/app/lib/connections/prisma";
import NotFoundError from "@/app/lib/errors/NotFoundError";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Confirms `id` names a world history event before an edit or delete
 * (SPEC-014 §5.4): a row with no campaign. An id that is not a positive
 * whole number, or a campaign event (T6), is refused as not found, so the
 * world history page can never edit or delete one.
 */
export default async function findWorldHistoryEvent(
  id: unknown
): Promise<number> {
  if (typeof id !== "number" || !Number.isInteger(id) || id <= 0) {
    throw new NotFoundError("World history event", String(id));
  }

  let event;
  try {
    event = await prisma.calendarEvent.findUnique({
      where: { id },
      select: { campaignId: true },
    });
  } catch (error) {
    throw toDatabaseError("looking up world history event", error);
  }

  if (!event || event.campaignId !== null) {
    throw new NotFoundError("World history event", id);
  }
  return id;
}

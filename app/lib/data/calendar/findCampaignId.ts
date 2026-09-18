import prisma from "@/app/lib/connections/prisma";
import NotFoundError from "@/app/lib/errors/NotFoundError";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import isPositiveId from "@/app/lib/utils/isPositiveId";

/**
 * Confirms `id` names a campaign before the calendar writes to it
 * (SPEC-014 T6). The page supplies the id, not the DM, so a bad one is a
 * not-found, not a field error.
 */
export default async function findCampaignId(id: unknown): Promise<number> {
  if (!isPositiveId(id)) throw new NotFoundError("Campaign", String(id));

  let campaign;
  try {
    campaign = await prisma.campaign.findUnique({
      where: { id },
      select: { id: true },
    });
  } catch (error) {
    throw toDatabaseError("looking up campaign", error);
  }

  if (!campaign) throw new NotFoundError("Campaign", id);
  return id;
}

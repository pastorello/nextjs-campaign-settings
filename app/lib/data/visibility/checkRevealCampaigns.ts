import prisma from "@/app/lib/connections/prisma";
import fieldError from "@/app/lib/data/validation/fieldError";
import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";
import type GameSystem from "@/app/lib/definitions/GameSystem";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Checks the campaigns a record is about to be revealed to (SPEC-022 T6):
 * each must exist, and, for a catalogue that belongs to one system, be that
 * system's. Returns the field errors under `field`, or null. Zod cannot ask
 * the database, so this runs in the action, like `checkRecordImageReference`.
 */
export default async function checkRevealCampaigns(
  ids: number[] | undefined,
  { field, system }: { field: string; system?: GameSystem }
): Promise<FieldErrors | null> {
  if (!ids || ids.length === 0) return null;

  let campaigns;
  try {
    campaigns = await prisma.campaign.findMany({
      where: { id: { in: ids } },
      select: { id: true, system: true },
    });
  } catch (error) {
    throw toDatabaseError("checking the campaigns to reveal to", error);
  }

  if (campaigns.length !== new Set(ids).size) {
    return { [field]: [fieldError("campaignNotFound")] };
  }
  if (system && campaigns.some((campaign) => campaign.system !== system)) {
    return { [field]: [fieldError("revealWrongSystem")] };
  }
  return null;
}

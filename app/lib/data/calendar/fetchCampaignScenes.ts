import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import CampaignSceneOption from "@/app/lib/definitions/interfaces/calendar/CampaignSceneOption";

/**
 * Every scene of a campaign's adventures (SPEC-014 §5.4, T6), in ladder
 * order and then scene order — the options of the event form's scene
 * select, which narrows them to the chosen adventure's.
 */
export default async function fetchCampaignScenes(
  campaignId: number
): Promise<CampaignSceneOption[]> {
  try {
    return await prisma.scene.findMany({
      where: { adventure: { campaignId } },
      orderBy: [{ adventure: { position: "asc" } }, { position: "asc" }],
      select: { id: true, title: true, adventureId: true },
    });
  } catch (error) {
    throw toDatabaseError("fetching the campaign's scenes", error);
  }
}

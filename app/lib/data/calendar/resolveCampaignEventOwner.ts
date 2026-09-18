import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";

export type ResolvedOwner =
  | { ok: true; adventureId: number | null; sceneId: number | null }
  | { ok: false; errors: FieldErrors };

/**
 * Checks the adventure and scene a campaign event names against its
 * campaign (SPEC-014 §5.4, edge cases):
 *
 * - the adventure, if named, belongs to the campaign;
 * - the scene, if named, belongs to the named adventure — or, with no
 *   adventure named, to one of the campaign's adventures, and the event's
 *   adventure is then set from the scene.
 *
 * A row that does not exist is refused the same way as one of another
 * campaign: to the DM both are "not one of this campaign's". Each refusal
 * is a field error on the field to change.
 */
export default async function resolveCampaignEventOwner(
  campaignId: number,
  adventureId: number | null,
  sceneId: number | null
): Promise<ResolvedOwner> {
  try {
    if (adventureId !== null) {
      const adventure = await prisma.adventure.findUnique({
        where: { id: adventureId },
        select: { campaignId: true },
      });
      if (adventure?.campaignId !== campaignId) {
        return refuse("adventureId", "adventureNotInCampaign");
      }
    }

    if (sceneId === null) return { ok: true, adventureId, sceneId };

    const scene = await prisma.scene.findUnique({
      where: { id: sceneId },
      select: {
        adventureId: true,
        adventure: { select: { campaignId: true } },
      },
    });
    if (adventureId !== null) {
      return scene?.adventureId === adventureId
        ? { ok: true, adventureId, sceneId }
        : refuse("sceneId", "sceneNotInAdventure");
    }
    if (scene?.adventure.campaignId !== campaignId) {
      return refuse("sceneId", "sceneNotInCampaign");
    }
    return { ok: true, adventureId: scene.adventureId, sceneId };
  } catch (error) {
    throw toDatabaseError(
      "checking a campaign event's adventure and scene",
      error
    );
  }
}

function refuse(
  field: "adventureId" | "sceneId",
  key: "adventureNotInCampaign" | "sceneNotInAdventure" | "sceneNotInCampaign"
): ResolvedOwner {
  return { ok: false, errors: { [field]: [{ key }] } };
}

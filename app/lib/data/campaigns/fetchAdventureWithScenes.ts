import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import Adventure from "@/app/lib/definitions/interfaces/campaign/Adventure";
import AdventureStatus from "@/app/lib/definitions/enums/campaign/AdventureStatus";
import Scene from "@/app/lib/definitions/interfaces/campaign/Scene";
import SceneKind from "@/app/lib/definitions/enums/campaign/SceneKind";
import SceneCreature from "@/app/lib/definitions/interfaces/campaign/SceneCreature";
import Loot from "@/app/lib/definitions/interfaces/campaign/Loot";

export interface SceneWithDetails extends Scene {
  creatures: SceneCreature[];
  loot: Loot[];
}

export interface AdventureWithScenes extends Adventure {
  scenes: SceneWithDetails[];
}

/**
 * One adventure with its full scene tree — scenes, and each scene's
 * creatures and loot rows, all in position order (SPEC-013 §5's adventure
 * page: "its scenes in order", each with its own creatures and loot). Every
 * budget target field passes through as-authored, `null` included — an
 * unset target is not a target of zero (§5's edge cases).
 *
 * Outside the metadata layer (ADR-0011), same reasoning as `fetchCampaign`:
 * a plain `select`-and-map read, not `getQuery`/`buildResultSchema`.
 */
export default async function fetchAdventureWithScenes(
  adventureId: number
): Promise<AdventureWithScenes | null> {
  let row;
  try {
    row = await prisma.adventure.findUnique({
      where: { id: adventureId },
      select: {
        id: true,
        campaignId: true,
        position: true,
        targetLevel: true,
        title: true,
        synopsis: true,
        timeline: true,
        status: true,
        xpTarget: true,
        currencyTarget: true,
        currencyUnit: true,
        permanentItemTarget: true,
        consumableTarget: true,
        scenes: {
          orderBy: { position: "asc" },
          select: {
            id: true,
            adventureId: true,
            position: true,
            kind: true,
            title: true,
            description: true,
            xpAward: true,
            grantsHeroPoint: true,
            awarded: true,
            zoneId: true,
            createdAt: true,
            updatedAt: true,
            creatures: {
              orderBy: { position: "asc" },
              select: {
                id: true,
                sceneId: true,
                position: true,
                name: true,
                level: true,
                xpEach: true,
                quantity: true,
                note: true,
                awarded: true,
                npcId: true,
              },
            },
            loot: {
              orderBy: { position: "asc" },
              select: {
                id: true,
                sceneId: true,
                position: true,
                description: true,
                quantity: true,
                value: true,
                taken: true,
                magicItemId: true,
                treasureId: true,
              },
            },
          },
        },
      },
    });
  } catch (error) {
    throw toDatabaseError("fetching the adventure", error);
  }

  if (!row) return null;

  return {
    id: row.id,
    campaignId: row.campaignId,
    position: row.position,
    targetLevel: row.targetLevel,
    title: row.title,
    synopsis: row.synopsis,
    timeline: row.timeline,
    status: row.status as AdventureStatus,
    xpTarget: row.xpTarget,
    currencyTarget: row.currencyTarget,
    currencyUnit: row.currencyUnit,
    permanentItemTarget: row.permanentItemTarget,
    consumableTarget: row.consumableTarget,
    // `kind` is a raw `String` column (SPEC-013 §6); the six values written
    // to it are exactly `SceneKind`'s members, enforced at write time by
    // the scene editor's validator (T6).
    scenes: row.scenes.map((scene) => ({
      ...scene,
      kind: scene.kind as SceneKind,
    })),
  };
}

import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import GameSystem, { isGameSystem } from "@/app/lib/definitions/GameSystem";

/** The row a campaign write touches, by whichever id it has. */
export type RulesTarget =
  | { campaignId: number | null }
  | { adventureId: number }
  | { sceneId: number }
  | { sceneCreatureId: number }
  | { lootId: number };

const SYSTEM = { campaign: { select: { system: true } } } as const;
const VIA_ADVENTURE = { adventure: { select: SYSTEM } } as const;
const VIA_SCENE = { scene: { select: VIA_ADVENTURE } } as const;

/**
 * The rules a campaign row is written under (SPEC-030 §9 decision 1): its
 * campaign's system, and 5e for a standalone adventure, or a row that
 * cannot be found (the write then fails on its own). Server-only.
 */
export default async function fetchRulesSystem(
  target: RulesTarget
): Promise<GameSystem> {
  let system: string | undefined;
  try {
    if ("campaignId" in target) {
      if (target.campaignId === null) return "dnd5e";
      system = (
        await prisma.campaign.findUnique({
          where: { id: target.campaignId },
          select: { system: true },
        })
      )?.system;
    } else if ("adventureId" in target) {
      system = (
        await prisma.adventure.findUnique({
          where: { id: target.adventureId },
          select: SYSTEM,
        })
      )?.campaign?.system;
    } else if ("sceneId" in target) {
      system = (
        await prisma.scene.findUnique({
          where: { id: target.sceneId },
          select: VIA_ADVENTURE,
        })
      )?.adventure.campaign?.system;
    } else if ("sceneCreatureId" in target) {
      system = (
        await prisma.sceneCreature.findUnique({
          where: { id: target.sceneCreatureId },
          select: VIA_SCENE,
        })
      )?.scene.adventure.campaign?.system;
    } else {
      system = (
        await prisma.loot.findUnique({
          where: { id: target.lootId },
          select: VIA_SCENE,
        })
      )?.scene.adventure.campaign?.system;
    }
  } catch (error) {
    throw toDatabaseError("reading a campaign row's game system", error);
  }
  return isGameSystem(system) ? system : "dnd5e";
}

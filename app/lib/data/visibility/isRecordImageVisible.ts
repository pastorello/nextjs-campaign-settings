import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

import revealedWhere from "./revealedWhere";
import type VisibilityScope from "./VisibilityScope";

/**
 * Whether a record image may be served to the reader (SPEC-022 T7, R12):
 * always for the DM; for a player, only when the record that owns it is
 * visible to their campaign. That means a visible place, a revealed NPC,
 * deity, magic item or faction, or a Daggerheart catalogue record (a
 * domain, an ancestry, a community, a weapon or an armor: the rules, shown
 * to every player). A treasure is prep material, never shown, and so are an
 * adversary's, an environment's (SPEC-028 §9 decision 3) and loot's
 * (SPEC-029 §9 decision 1). An image no record owns is shown to no player.
 */
export default async function isRecordImageVisible(
  imageId: number,
  scope: VisibilityScope
): Promise<boolean> {
  if (scope.kind === "all") return true;

  const revealed = { imageId, ...revealedWhere(scope) };
  const select = { id: true } as const;
  try {
    const [zone, npc, deity, item, faction, ...catalogues] = await Promise.all([
      prisma.zone.findFirst({ where: { imageId }, select }),
      prisma.npc.findFirst({ where: revealed, select }),
      prisma.deities.findFirst({ where: revealed, select }),
      prisma.magicitems.findFirst({ where: revealed, select }),
      prisma.faction.findFirst({ where: revealed, select }),
      // The rules catalogues, shown to every player.
      prisma.dhDomain.findFirst({ where: { imageId }, select }),
      prisma.dhAncestry.findFirst({ where: { imageId }, select }),
      prisma.dhCommunity.findFirst({ where: { imageId }, select }),
      prisma.dhWeapon.findFirst({ where: { imageId }, select }),
      prisma.dhArmor.findFirst({ where: { imageId }, select }),
    ]);
    return (
      (zone !== null && scope.zones.has(zone.id)) ||
      npc !== null ||
      deity !== null ||
      item !== null ||
      faction !== null ||
      catalogues.some((row) => row !== null)
    );
  } catch (error) {
    throw toDatabaseError("checking who may see a record image", error);
  }
}

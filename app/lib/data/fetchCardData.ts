import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import prisma from "@/app/lib/connections/prisma";
import getVisibilityScope from "@/app/lib/data/visibility/getVisibilityScope";
import revealedWhere from "@/app/lib/data/visibility/revealedWhere";

/**
 * The overview's record counts. For a player (SPEC-022 T8c, R1) they count
 * what their campaign has been shown: the revealed records, the visible
 * places, and the rules catalogue in full. The DM's counts take no `where`.
 */
export default async function fetchCardData() {
  const scope = await getVisibilityScope();
  const player = scope.kind === "campaign" ? scope : null;
  const revealed = player && { where: revealedWhere(player) };
  try {
    const [
      numberOfmagicItems,
      numberOfNpc,
      numberOfSpells,
      numberOfDeities,
      numberOfPlaces,
      numberOfFactions,
    ] = await prisma.$transaction([
      revealed ? prisma.magicitems.count(revealed) : prisma.magicitems.count(),
      revealed ? prisma.npc.count(revealed) : prisma.npc.count(),
      prisma.spells.count(),
      revealed ? prisma.deities.count(revealed) : prisma.deities.count(),
      // Every place in the tree, not only positioned ones (DM decision,
      // 2026-08-18, TD-91) — no `where` filter, unlike
      // `countUnpositionedPlaces`, which deliberately scopes to a subset.
      // A player's count is the places their campaign can see.
      player
        ? prisma.zone.count({ where: { id: { in: [...player.zones] } } })
        : prisma.zone.count(),
      revealed ? prisma.faction.count(revealed) : prisma.faction.count(),
    ]);

    return {
      numberOfmagicItems,
      numberOfNpc,
      numberOfSpells,
      numberOfDeities,
      numberOfPlaces,
      numberOfFactions,
    };
  } catch (error) {
    throw toDatabaseError("fetching dashboard counts", error);
  }
}

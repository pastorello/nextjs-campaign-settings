import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import prisma from "@/app/lib/connections/prisma";

export default async function fetchCardData() {
  try {
    const [
      numberOfmagicItems,
      numberOfNpc,
      numberOfSpells,
      numberOfDeities,
      numberOfPlaces,
      numberOfFactions,
    ] = await prisma.$transaction([
      prisma.magicitems.count(),
      prisma.npc.count(),
      prisma.spells.count(),
      prisma.deities.count(),
      // Every place in the tree, not only positioned ones (DM decision,
      // 2026-08-18, TD-91) — no `where` filter, unlike
      // `countUnpositionedPlaces`, which deliberately scopes to a subset.
      prisma.zone.count(),
      prisma.faction.count(),
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

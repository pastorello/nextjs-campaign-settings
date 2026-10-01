import prisma from "@/app/lib/connections/prisma";
import getVisibilityScope from "@/app/lib/data/visibility/getVisibilityScope";
import fetchRevealedIds from "@/app/lib/data/visibility/fetchRevealedIds";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import type DhCommunityLink from "@/app/lib/definitions/interfaces/daggerheart/DhCommunityLink";

/**
 * The communities tied to each faction (SPEC-027 §5.6), for the faction
 * cards under `daggerheart`, in one query rather than one per card. For a
 * player (SPEC-022) only factions revealed to their campaign are keys: the
 * map reaches the client whole.
 */
export default async function fetchFactionCommunities(): Promise<
  Map<number, DhCommunityLink[]>
> {
  const scope = await getVisibilityScope();
  const factionIds = await fetchRevealedIds("faction", scope);
  let rows;
  try {
    rows = await prisma.dhCommunity.findMany({
      where: { factions: { some: {} } },
      select: { id: true, name: true, factions: { select: { id: true } } },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    throw toDatabaseError("fetching factions' communities", error);
  }

  const byFaction = new Map<number, DhCommunityLink[]>();
  for (const { id, name, factions } of rows) {
    for (const faction of factions) {
      if (factionIds !== null && !factionIds.has(faction.id)) continue;
      byFaction.set(faction.id, [
        ...(byFaction.get(faction.id) ?? []),
        { id, name },
      ]);
    }
  }
  return byFaction;
}

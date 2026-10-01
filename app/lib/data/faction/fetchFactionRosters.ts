import prisma from "../../connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import getVisibilityScope from "@/app/lib/data/visibility/getVisibilityScope";
import revealedWhere from "@/app/lib/data/visibility/revealedWhere";

export interface RosterMember {
  id: number;
  name: string;
}

/**
 * Every faction's roster, in one query rather than one per card (21 factions
 * over 119 NPCs — SPEC-006 §7 calls the per-faction version "a plain read";
 * grouping a single `findMany` is the same read, just not run twenty-one
 * times).
 *
 * For a player (SPEC-022 T8b, R5): a roster names only the NPCs revealed to
 * their campaign, and only factions revealed to it have one at all. The map
 * reaches the client whole, so a hidden faction's key would still say who
 * is in it.
 */
export default async function fetchFactionRosters(): Promise<
  Map<number, RosterMember[]>
> {
  const scope = await getVisibilityScope();
  let rows;
  try {
    rows = await prisma.npc.findMany({
      where: {
        faction: { not: null },
        ...revealedWhere(scope),
        ...(scope.kind === "campaign" && {
          factionRef: revealedWhere(scope),
        }),
      },
      select: { id: true, name: true, faction: true },
      orderBy: { name: "asc" },
    });
  } catch (error) {
    throw toDatabaseError("fetching faction rosters", error);
  }

  const rosters = new Map<number, RosterMember[]>();
  for (const row of rows) {
    if (row.faction === null) continue;
    const members = rosters.get(row.faction) ?? [];
    members.push({ id: row.id, name: row.name });
    rosters.set(row.faction, members);
  }

  return rosters;
}

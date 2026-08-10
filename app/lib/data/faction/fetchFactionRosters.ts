import prisma from "../../connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

export interface RosterMember {
  id: number;
  name: string;
}

/**
 * Every faction's roster, in one query rather than one per card (21 factions
 * over 119 NPCs — SPEC-006 §7 calls the per-faction version "a plain read";
 * grouping a single `findMany` is the same read, just not run twenty-one
 * times).
 */
export default async function fetchFactionRosters(): Promise<
  Map<number, RosterMember[]>
> {
  let rows;
  try {
    rows = await prisma.npc.findMany({
      where: { faction: { not: null } },
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

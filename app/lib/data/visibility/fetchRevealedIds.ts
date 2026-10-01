import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

import revealedWhere from "./revealedWhere";
import type VisibilityScope from "./VisibilityScope";

type RevealedTable = "faction" | "npc" | "deities" | "magicitems";

/**
 * The ids of one revealed-one-by-one table the reader has been shown
 * (SPEC-022 T8b), or null for the DM, who sees them all. For a reference
 * to such a record from another one, such as an NPC's faction.
 */
export default async function fetchRevealedIds(
  table: RevealedTable,
  scope: VisibilityScope
): Promise<ReadonlySet<number> | null> {
  if (scope.kind === "all") return null;
  const args = { where: revealedWhere(scope), select: { id: true } } as const;
  try {
    const rows =
      table === "faction"
        ? await prisma.faction.findMany(args)
        : table === "npc"
          ? await prisma.npc.findMany(args)
          : table === "deities"
            ? await prisma.deities.findMany(args)
            : await prisma.magicitems.findMany(args);
    return new Set(rows.map(({ id }) => id));
  } catch (error) {
    throw toDatabaseError(`reading the revealed ${table}`, error);
  }
}

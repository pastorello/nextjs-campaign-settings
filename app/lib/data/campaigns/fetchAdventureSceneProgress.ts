import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

export interface AdventureSceneProgress {
  total: number;
  awarded: number;
}

/**
 * How many of an adventure's scenes are marked awarded, for the campaign
 * ladder's "progress readout" (SPEC-013 §5.2). One grouped query for every
 * adventure on the ladder, not one per row — `AdventureLadder` never learns
 * about `prisma.scene`.
 *
 * Deliberately not part of `fetchCampaign` (T5): that read has its own test
 * suite already asserting an exact shape, and this is a second, independent
 * concern — how far play has gotten, not what the ladder is made of.
 *
 * A campaign with no adventures short-circuits before touching the
 * database — the common state on first use.
 */
export default async function fetchAdventureSceneProgress(
  adventureIds: number[]
): Promise<Record<number, AdventureSceneProgress>> {
  const progress: Record<number, AdventureSceneProgress> = {};
  for (const id of adventureIds) {
    progress[id] = { total: 0, awarded: 0 };
  }

  if (adventureIds.length === 0) return progress;

  let rows;
  try {
    rows = await prisma.scene.groupBy({
      by: ["adventureId", "awarded"],
      where: { adventureId: { in: adventureIds } },
      _count: { _all: true },
    });
  } catch (error) {
    throw toDatabaseError("computing adventure scene progress", error);
  }

  for (const row of rows) {
    const entry = progress[row.adventureId];
    if (!entry) continue;
    entry.total += row._count._all;
    if (row.awarded) entry.awarded += row._count._all;
  }

  return progress;
}

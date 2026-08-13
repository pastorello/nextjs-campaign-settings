"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import type PlaceDeletionImpact from "../../definitions/interfaces/maps/PlaceDeletionImpact";

/**
 * Real counts for the delete-place confirmation (SPEC-010 T3, §7),
 * read-only and computed fresh at the moment the DM asks. Mirrors the
 * `where` clauses `deletePlace` already writes against — this only counts
 * them rather than mutating anything.
 */
export default async function fetchPlaceDeletionImpact(
  id: number
): Promise<PlaceDeletionImpact> {
  await requireSession();

  try {
    const [zoneCount, poiCount, npcCount, deityCount] = await Promise.all([
      prisma.zone.count({ where: { parentId: id } }),
      prisma.poi.count({ where: { zoneId: id } }),
      prisma.npc.count({ where: { zoneId: id, poiId: null } }),
      prisma.deities.count({ where: { zoneId: id, poiId: null } }),
    ]);

    return {
      placeCount: zoneCount + poiCount,
      npcCount,
      deityCount,
    };
  } catch (error) {
    throw toDatabaseError("counting place deletion impact", error);
  }
}

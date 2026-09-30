"use server";

import prisma from "@/app/lib/connections/prisma";
import requireDm from "@/app/lib/auth/requireDm";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import type LandmarkDeletionImpact from "../../definitions/interfaces/maps/LandmarkDeletionImpact";

/**
 * Real counts for deleting a landmark (SPEC-023's landmark dialog, possible
 * since TD-147), read-only and computed fresh at the moment the DM asks.
 * Mirrors the `where` clause `deletePoi` writes against — this only counts
 * the rows it detaches, the way `fetchPlaceDeletionImpact` mirrors
 * `deletePlace`.
 */
export default async function fetchLandmarkDeletionImpact(
  id: number
): Promise<LandmarkDeletionImpact> {
  await requireDm();

  try {
    const [npcCount, deityCount] = await Promise.all([
      prisma.npc.count({ where: { poiId: id } }),
      prisma.deities.count({ where: { poiId: id } }),
    ]);

    return { npcCount, deityCount };
  } catch (error) {
    throw toDatabaseError("counting landmark deletion impact", error);
  }
}

import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import deriveEntityAncestry, {
  type PlaceAncestor,
} from "@/app/modules/maps/lib/utils/deriveEntityAncestry";
import type { LinkableEntityType } from "@/app/modules/maps/types/poi";

/**
 * Where every NPC or deity sits in the world tree, derived rather than read
 * off a stored column (SPEC-004 T4/T5a; sourced from `zoneId`/`poiId` since
 * SPEC-008 T8 — see `deriveEntityAncestry`).
 *
 * Three queries regardless of how many records the caller resolves against
 * them: the list views call this once per render, not once per row.
 */
export default async function fetchDerivedAncestry(
  linkedType: LinkableEntityType
): Promise<Map<number, PlaceAncestor[]>> {
  try {
    const [zones, pois, entities] = await Promise.all([
      prisma.zone.findMany({
        select: { id: true, title: true, kind: true, parentId: true },
      }),
      prisma.poi.findMany({
        select: { id: true, title: true, zoneId: true },
      }),
      linkedType === "npc"
        ? prisma.npc.findMany({
            select: { id: true, zoneId: true, poiId: true },
          })
        : prisma.deities.findMany({
            select: { id: true, zoneId: true, poiId: true },
          }),
    ]);

    return deriveEntityAncestry(zones, pois, entities);
  } catch (error) {
    throw toDatabaseError("resolving derived locations", error);
  }
}

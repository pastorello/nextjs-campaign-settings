import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import deriveEntityAncestry, {
  type PlaceAncestor,
} from "@/app/modules/maps/lib/utils/deriveEntityAncestry";
import type { LinkableEntityType } from "@/app/modules/maps/types/poi";
import getVisibilityScope from "@/app/lib/data/visibility/getVisibilityScope";
import revealedWhere from "@/app/lib/data/visibility/revealedWhere";

/**
 * Where every NPC or deity sits in the world tree, derived rather than read
 * off a stored column (SPEC-004 T4/T5a; sourced from `zoneId`/`poiId` since
 * SPEC-008 T8 — see `deriveEntityAncestry`).
 *
 * Three queries regardless of how many records the caller resolves against
 * them: the list views call this once per render, not once per row.
 *
 * The single read path for both `EntityLibrary` (public cards, via
 * `toDerivedPlacements`) and `EntityList` (the admin table) as of TD-77 —
 * they used to resolve a record's location through two independent
 * functions that only agreed by coincidence, both relying on the same
 * `zoneId := poi.zoneId` invariant (ADR-0010) without anything enforcing it.
 *
 * For a player (SPEC-022 T8b, R6): only the records revealed to their
 * campaign, and a hidden place is no place. A record pinned to a hidden
 * zone reads as unknown; one at a hidden landmark in a visible zone reads
 * as that zone. The map reaches the client whole, so it must not carry a
 * hidden record or a hidden place's name.
 */
export default async function fetchDerivedAncestry(
  linkedType: LinkableEntityType
): Promise<Map<number, PlaceAncestor[]>> {
  const scope = await getVisibilityScope();
  const entityArgs = {
    where: revealedWhere(scope),
    select: { id: true, zoneId: true, poiId: true },
  } as const;
  try {
    const [zones, pois, entities] = await Promise.all([
      prisma.zone.findMany({
        select: { id: true, title: true, kind: true, parentId: true },
      }),
      prisma.poi.findMany({
        select: { id: true, title: true, zoneId: true },
      }),
      linkedType === "npc"
        ? prisma.npc.findMany(entityArgs)
        : prisma.deities.findMany(entityArgs),
    ]);

    if (scope.kind === "all") {
      return deriveEntityAncestry(zones, pois, entities);
    }
    return deriveEntityAncestry(
      zones.filter(({ id }) => scope.zones.has(id)),
      pois.filter(({ id }) => scope.pois.has(id)),
      entities.map((entity) => ({
        id: entity.id,
        zoneId:
          entity.zoneId !== null && scope.zones.has(entity.zoneId)
            ? entity.zoneId
            : null,
        poiId:
          entity.poiId !== null && scope.pois.has(entity.poiId)
            ? entity.poiId
            : null,
      }))
    );
  } catch (error) {
    throw toDatabaseError("resolving derived locations", error);
  }
}

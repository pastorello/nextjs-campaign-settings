import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/**
 * Of `countUnpositionedPlaces`'s tree-wide total, how many are unpositioned
 * for a specific, structural reason: their own parent has no map yet, so
 * there is nothing to draw them onto until the DM uploads one a level up
 * (`MapUploadControl`, SPEC-007 T1). The rest of the total is unpositioned
 * for the ordinary reason — a map exists and the place simply hasn't been
 * placed on it.
 *
 * TD-79: `countUnpositionedPlaces` couldn't tell these two apart. As of
 * this function's introduction the category this counts is still empty in
 * practice — `createPlace` can only be reached by right-clicking an
 * already-rendered map, so a place cannot come into existence under a
 * mapless parent through today's UI (TD-79's own re-scoping note). This
 * function exists so the report is correct the moment that stops being
 * true — a map deletion feature or an admin place list, neither of which
 * exists today — rather than needing a data-layer change at the same time
 * as whatever UI change makes the category reachable.
 *
 * Deliberately two extra queries rather than one `WHERE`: "this place's
 * parent has no map" is a join, not a scalar predicate, so it cannot be
 * folded into `countUnpositionedPlaces`'s existing counts without changing
 * what those already-tested counts mean.
 */
export default async function countBlockedUnpositionedPlaces(): Promise<number> {
  try {
    const [zones, landmarks] = await Promise.all([
      prisma.zone.count({
        where: {
          lat: null,
          parentId: { not: null },
          parent: { mapImage: null },
        },
      }),
      prisma.poi.count({
        where: { lat: null, zone: { mapImage: null } },
      }),
    ]);
    return zones + landmarks;
  } catch (error) {
    throw toDatabaseError("counting places blocked on a parent's map", error);
  }
}

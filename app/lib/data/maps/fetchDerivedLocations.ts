import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import deriveEntityLocations from "@/app/modules/maps/lib/utils/deriveEntityLocations";
import type { LinkableEntityType } from "@/app/modules/maps/types/poi";

/**
 * A record's location, derived from the `poi` tree rather than read off a
 * stored column (SPEC-004 T4) — see `deriveEntityLocations` for why.
 *
 * One query for the whole `poi` table, regardless of how many NPCs or
 * deities the caller resolves against it: `EntityList` calls this once per
 * page render, not once per row.
 */
export default async function fetchDerivedLocations(
  linkedType: LinkableEntityType
): Promise<Map<number, string>> {
  let rows;
  try {
    rows = await prisma.poi.findMany({
      select: {
        id: true,
        title: true,
        parentId: true,
        linkedType: true,
        linkedId: true,
      },
    });
  } catch (error) {
    throw toDatabaseError("resolving derived locations", error);
  }

  return deriveEntityLocations(rows, linkedType);
}

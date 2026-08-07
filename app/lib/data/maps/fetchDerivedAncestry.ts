import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import deriveEntityAncestry, {
  type PlaceAncestor,
} from "@/app/modules/maps/lib/utils/deriveEntityAncestry";
import type { LinkableEntityType } from "@/app/modules/maps/types/poi";

/**
 * Where every NPC or deity sits in the world tree, derived rather than read
 * off a stored column (SPEC-004 T4/T5a) — see `deriveEntityAncestry`.
 *
 * One query for the whole `poi` table regardless of how many records the
 * caller resolves against it: the list views call this once per render, not
 * once per row.
 */
export default async function fetchDerivedAncestry(
  linkedType: LinkableEntityType
): Promise<Map<number, PlaceAncestor[]>> {
  let rows;
  try {
    rows = await prisma.poi.findMany({
      select: {
        id: true,
        title: true,
        kind: true,
        parentId: true,
        linkedType: true,
        linkedId: true,
      },
    });
  } catch (error) {
    throw toDatabaseError("resolving derived locations", error);
  }

  return deriveEntityAncestry(rows, linkedType);
}

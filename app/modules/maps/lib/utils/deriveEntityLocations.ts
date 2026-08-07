import type { LinkableEntityType } from "@/app/modules/maps/types/poi";

interface PlaceIndexRow {
  id: number;
  title: string;
  parentId: number | null;
  linkedType: string | null;
  linkedId: number | null;
}

/**
 * A record's derived location (SPEC-004 §5 point 6, T4) is its own pin's
 * parent's title — never stored, walked from the tree every time it is
 * asked, so it cannot drift the way `npc.location` and `deities.residence`
 * could (SPEC-004 §6's Helios/Paradiso example).
 *
 * Takes the whole `poi` table in one shot rather than one query per record:
 * with everything in memory, resolving N records is N pointer lookups, not N
 * round trips.
 */
export default function deriveEntityLocations(
  rows: PlaceIndexRow[],
  linkedType: LinkableEntityType
): Map<number, string> {
  const titleById = new Map(rows.map((row) => [row.id, row.title]));
  const locations = new Map<number, string>();

  for (const row of rows) {
    if (row.linkedType !== linkedType || row.linkedId === null) continue;
    if (row.parentId === null) continue;

    const parentTitle = titleById.get(row.parentId);
    if (parentTitle !== undefined) {
      locations.set(row.linkedId, parentTitle);
    }
  }

  return locations;
}

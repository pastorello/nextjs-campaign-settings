import type DerivedPlacement from "@/app/lib/definitions/interfaces/maps/DerivedPlacement";
import type {
  LinkableEntityType,
  PlaceKind,
} from "@/app/modules/maps/types/poi";

/** One step up the tree from a record's own pin. */
export interface PlaceAncestor {
  id: number;
  title: string;
  /** Raw `poi.kind`; a row read back is only a `string` (see `isPlaceKind`). */
  kind: string;
}

interface PlaceIndexRow {
  id: number;
  title: string;
  kind: string;
  parentId: number | null;
  linkedType: string | null;
  linkedId: number | null;
}

/**
 * Every ancestor of a record's pin, nearest first (SPEC-004 §5 point 6,
 * T5a) — the tree-native replacement for the stored `npc.location`,
 * `deities.location` and `deities.residence` columns.
 *
 * **Why the whole chain and not just the parent.** T4's first cut walked one
 * level, which is all the NPC list needs. `DeityCard` shows two — "Paradiso,
 * Cieli", the place *and* the plane containing it — and the plane is not
 * positionally the second entry: an NPC in Skreebars has Regno di Kang
 * there. The plane is the nearest ancestor whose `kind` says so, which is
 * what `findAncestorOfKind` is for.
 *
 * Takes the whole `poi` table in one shot rather than one query per record:
 * with everything in memory, resolving N records is N pointer walks, not N
 * round trips.
 *
 * A record present here with an **empty** chain is pinned at the root; a
 * record **absent** from the map has no pin at all. The two are different
 * states and callers can tell them apart.
 */
export default function deriveEntityAncestry(
  rows: PlaceIndexRow[],
  linkedType: LinkableEntityType
): Map<number, PlaceAncestor[]> {
  const byId = new Map(rows.map((row) => [row.id, row]));
  const ancestry = new Map<number, PlaceAncestor[]>();

  for (const row of rows) {
    if (row.linkedType !== linkedType || row.linkedId === null) continue;

    const chain: PlaceAncestor[] = [];
    // Bounded by construction rather than by trusting the data: the mutation
    // boundary rejects reparenting a place under its own descendant
    // (SPEC-004 §5), but Postgres permits a cycle in a self-referencing FK,
    // so a corrupt row must not hang a page render.
    const seen = new Set<number>([row.id]);
    let currentId = row.parentId;

    while (currentId !== null && !seen.has(currentId)) {
      const place = byId.get(currentId);
      if (place === undefined) break;
      seen.add(place.id);
      chain.push({ id: place.id, title: place.title, kind: place.kind });
      currentId = place.parentId;
    }

    ancestry.set(row.linkedId, chain);
  }

  return ancestry;
}

/** The nearest ancestor of a given kind — the plane a deity resides in. */
export function findAncestorOfKind(
  chain: PlaceAncestor[] | undefined,
  kind: PlaceKind
): PlaceAncestor | undefined {
  return chain?.find((ancestor) => ancestor.kind === kind);
}

/**
 * The two titles the cards actually display, keyed by record id — the
 * derived replacements for `location` (the place) and `residence` (the
 * plane containing it).
 *
 * A plain object of plain strings rather than the `PlaceAncestor[]` chain
 * itself: these cross into client components (`NpcCard`, `DeityCard`), and
 * *which* ancestor counts as the plane is a tree question that belongs on
 * the server beside the walk that answered it, not restated per card.
 */
export function toDerivedPlacements(
  ancestry: Map<number, PlaceAncestor[]>
): Record<number, DerivedPlacement> {
  const placements: Record<number, DerivedPlacement> = {};

  for (const [recordId, chain] of ancestry) {
    placements[recordId] = {
      place: chain[0]?.title ?? null,
      plane: findAncestorOfKind(chain, "plane")?.title ?? null,
    };
  }

  return placements;
}

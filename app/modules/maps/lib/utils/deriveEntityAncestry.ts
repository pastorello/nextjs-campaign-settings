import type DerivedPlacement from "@/app/lib/definitions/interfaces/maps/DerivedPlacement";
import type { PlaceKind } from "@/app/modules/maps/types/poi";

/** One step up the tree from where an entity is assigned. */
export interface PlaceAncestor {
  id: number;
  title: string;
  /** `"poi"` for a landmark entry, the zone's own `kind` otherwise. */
  kind: string;
}

interface ZoneIndexRow {
  id: number;
  title: string;
  kind: string;
  parentId: number | null;
}

interface PoiIndexRow {
  id: number;
  title: string;
  zoneId: number;
}

interface EntityLocationRow {
  id: number;
  zoneId: number | null;
  poiId: number | null;
}

/**
 * Every ancestor of a record's assigned location, nearest first (SPEC-004
 * §5 point 6, T5a; sourced from `npc.zoneId`/`poiId` since SPEC-008 T8,
 * rather than walked up from a pin in the old `poi` table).
 *
 * **Why the whole chain and not just the immediate place.** `DeityCard`
 * shows two — "Paradiso, Cieli", the place *and* the plane containing it —
 * and the plane is not positionally the second entry: an NPC in Skreebars
 * has Regno di Kang there. The plane is the nearest ancestor whose `kind`
 * says so, which is what `findAncestorOfKind` is for.
 *
 * The immediate entry is the landmark POI's own title when `poiId` is set
 * (more precise than its zone — the same rule the admin list's Location
 * column follows, `fetchEntityLocationSummaries`), otherwise the Zone
 * itself. A record with a `zoneId` but no matching zone row, or a broken
 * `zone.parentId` chain, stops there rather than throwing — the mutation
 * boundary prevents a cycle, but a corrupt row must not hang a render.
 *
 * A record present here with a **single-entry** chain is assigned directly
 * to the root zone (or its POI); a record **absent** has no `zoneId` at
 * all. The two are different states and callers can tell them apart.
 */
export default function deriveEntityAncestry(
  zones: ZoneIndexRow[],
  pois: PoiIndexRow[],
  entities: EntityLocationRow[]
): Map<number, PlaceAncestor[]> {
  const zoneById = new Map(zones.map((zone) => [zone.id, zone]));
  const poiById = new Map(pois.map((poi) => [poi.id, poi]));
  const ancestry = new Map<number, PlaceAncestor[]>();

  for (const entity of entities) {
    if (entity.zoneId === null) continue;

    const chain: PlaceAncestor[] = [];

    if (entity.poiId !== null) {
      const poi = poiById.get(entity.poiId);
      if (poi) chain.push({ id: poi.id, title: poi.title, kind: "poi" });
    }

    const seen = new Set<number>();
    let currentId: number | null = entity.zoneId;
    while (currentId !== null && !seen.has(currentId)) {
      const zone = zoneById.get(currentId);
      if (zone === undefined) break;
      seen.add(zone.id);
      chain.push({ id: zone.id, title: zone.title, kind: zone.kind });
      currentId = zone.parentId;
    }

    ancestry.set(entity.id, chain);
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
 * What the cards actually display, plus what re-assigning a record needs,
 * keyed by record id — the derived replacements for `location` (the place)
 * and `residence` (the plane containing it), and `zoneId`/`poiId` for
 * `AssignLocationButton` (SPEC-007 T3).
 *
 * A plain object of plain strings and ids rather than the `PlaceAncestor[]`
 * chain itself: these cross into client components (`NpcCard`,
 * `DeityCard`), and *which* ancestor counts as the plane — or is the
 * landmark versus the zone — is a tree question that belongs on the server
 * beside the walk that answered it, not restated per card.
 *
 * `zoneId`/`poiId` are read off `chain` rather than a second query
 * (SPEC-007 §7: "do not add a third read") — the nearest entry is either
 * the landmark (`kind: "poi"`, in which case the entry right after it is
 * always its own zone, per `resolveLocationAssignment`'s invariant that
 * `zoneId := poi.zoneId`) or the zone itself.
 */
export function toDerivedPlacements(
  ancestry: Map<number, PlaceAncestor[]>
): Record<number, DerivedPlacement> {
  const placements: Record<number, DerivedPlacement> = {};

  for (const [recordId, chain] of ancestry) {
    const immediate = chain[0];
    const isPoi = immediate?.kind === "poi";

    placements[recordId] = {
      place: immediate?.title ?? null,
      plane: findAncestorOfKind(chain, "plane")?.title ?? null,
      zoneId: (isPoi ? chain[1]?.id : immediate?.id) ?? null,
      poiId: isPoi ? immediate.id : null,
    };
  }

  return placements;
}

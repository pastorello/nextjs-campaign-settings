/**
 * Where a record sits in the world tree, reduced to what the cards display
 * and what re-assigning it needs (SPEC-004 T5a; `zoneId`/`poiId` added by
 * SPEC-007 T3) — the derived replacement for the stored `location` and
 * `residence` columns, plus the ids `AssignLocationButton` needs to open
 * its modal without a second read (see `toDerivedPlacements`).
 *
 * All four nullable, and the nulls are meaningful rather than missing data:
 * a record with no pin has none of them, and a record pinned somewhere
 * outside any plane has a `place`/`zoneId` but no `plane`.
 */
interface DerivedPlacement {
  /** The immediate place the record's pin sits in. */
  place: string | null;
  /** The nearest ancestor of kind `plane` — a deity's residence. */
  plane: string | null;
  /** The Zone the record is assigned to — always set alongside `poiId`. */
  zoneId: number | null;
  /** The landmark the record is pinned to, if more specific than the Zone. */
  poiId: number | null;
}

export default DerivedPlacement;

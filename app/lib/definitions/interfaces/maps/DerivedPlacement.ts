/**
 * Where a record sits in the world tree, reduced to the two titles the
 * cards display (SPEC-004 T5a) — the derived replacements for the stored
 * `location` and `residence` columns.
 *
 * Both nullable, and the nulls are meaningful rather than missing data: a
 * record with no pin has neither, and a record pinned somewhere outside any
 * plane has a `place` but no `plane`.
 */
interface DerivedPlacement {
  /** The immediate place the record's pin sits in. */
  place: string | null;
  /** The nearest ancestor of kind `plane` — a deity's residence. */
  plane: string | null;
}

export default DerivedPlacement;

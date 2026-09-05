import type { PlaceKind } from "@/app/modules/maps/types/poi";

/**
 * One row of the campaign-wide unplaced pool (SPEC-017 §5) — a `zone` with
 * no coordinates, or a landmark `poi` with none, merged into one shape the
 * way `PlaceChild` already merges the two tables SPEC-008 T8 split.
 *
 * Narrower than `PlaceChild` on purpose: the picker renders a title and a
 * provenance label and routes the pick to a mutation, so nothing here
 * carries a map, a footprint or a grid. `kind` is the discriminator that
 * says which table the id belongs to — `"poi"` for a landmark, a navigable
 * kind otherwise — and TD-102 is what happens without it, since the two id
 * sequences are independent.
 *
 * `parentId`/`parentTitle` are **provenance, not position**: the place this
 * one came from, shown so two identically-named places can be told apart
 * before one is taken (§5). A placement overwrites `parentId`
 * ([ADR-0012](../../../../../docs/adr/0012-placement-writes-the-tree-edge.md),
 * clause 2), so nothing may read it as "where this place is".
 */
interface UnplacedPlace {
  id: number;
  title: string;
  kind: PlaceKind;
  parentId: number;
  parentTitle: string;
}

export default UnplacedPlace;

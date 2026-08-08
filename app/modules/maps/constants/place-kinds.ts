/**
 * Place kind list (SPEC-004 §5.1, T2). Declared in code, not user-extensible
 * — see `placeSchema.ts` for why this is a closed vocabulary rather than a
 * table (same reasoning as TD-61's option-backed fields).
 */

import type { PlaceKind } from "@/app/modules/maps/types/poi";

export const PLACE_KINDS: PlaceKind[] = [
  "region",
  "plane",
  "city",
  "dungeon",
  "poi",
];

/**
 * The kinds that carry their own map and can be descended into (SPEC-004
 * §10 M7 for `region`; T2 adds `plane`, `city` and `dungeon` as the same
 * shape — a bigger place containing smaller ones, not conceptually
 * different from `region`). Every other kind is a leaf.
 *
 * `as const satisfies` rather than a `PlaceKind[]` annotation: the latter
 * would widen every element back to the full `PlaceKind` union, which loses
 * exactly the per-element literal type `isNavigablePlaceKind`'s type guard
 * (and `placeSchema.ts`'s `z.enum`) depend on to narrow correctly.
 */
export const NAVIGABLE_PLACE_KINDS = [
  "region",
  "plane",
  "city",
  "dungeon",
] as const satisfies readonly PlaceKind[];

export function isNavigablePlaceKind(
  kind: PlaceKind
): kind is (typeof NAVIGABLE_PLACE_KINDS)[number] {
  return (NAVIGABLE_PLACE_KINDS as readonly string[]).includes(kind);
}

/**
 * Narrows a raw string to `PlaceKind`. `zone.kind` has no database-level
 * enum, so a row read back is only a `string` as far as the type system
 * knows — same reasoning as `isPOICategory` in `poi-categories.ts`.
 */
export function isPlaceKind(value: string): value is PlaceKind {
  return (PLACE_KINDS as readonly string[]).includes(value);
}

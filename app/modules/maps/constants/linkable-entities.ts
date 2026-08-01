/**
 * Linkable entity type configurations (TD-14 / SPEC-002)
 */

import type {
  LinkableEntityType,
  LinkableEntityTypeConfig,
} from "@/app/modules/maps/types/poi";

export const LINKABLE_ENTITY_TYPES: LinkableEntityTypeConfig[] = [
  { id: "npc", label: "NPC" },
  { id: "deity", label: "Deity" },
];

/**
 * Get linkable entity type config by ID
 */
export function getLinkableEntityTypeById(
  id: string
): LinkableEntityTypeConfig | undefined {
  return LINKABLE_ENTITY_TYPES.find((type) => type.id === id);
}

/**
 * Narrows a raw string to `LinkableEntityType`. There is no database-level
 * enum for `poi.linkedType` (SPEC-002 §6 — it's a polymorphic pair, not a
 * foreign key), so a value read back from Postgres is only ever a plain
 * `string` as far as the type system knows; this is where it gets checked
 * against reality.
 */
export function isLinkableEntityType(
  value: string
): value is LinkableEntityType {
  return LINKABLE_ENTITY_TYPES.some((type) => type.id === value);
}

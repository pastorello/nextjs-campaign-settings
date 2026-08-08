/**
 * Linkable entity type configurations. Originally TD-14/SPEC-002's for
 * `poi.linkedType` (a landmark linking to an entity, removed by SPEC-008
 * T8); now backs `AttachEntityButton`'s type selector — choosing which
 * domain's entity to attach a location to.
 */

import type { LinkableEntityTypeConfig } from "@/app/modules/maps/types/poi";

export const LINKABLE_ENTITY_TYPES: LinkableEntityTypeConfig[] = [
  { id: "npc", label: "NPC", path: "/dashboard/npc" },
  { id: "deity", label: "Deity", path: "/dashboard/deities" },
];

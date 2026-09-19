/**
 * Linkable entity type configurations. Originally TD-14/SPEC-002's for
 * `poi.linkedType` (a landmark linking to an entity, removed by SPEC-008
 * T8); now backs `AttachEntityButton`'s type selector — choosing which
 * domain's entity to attach a location to.
 *
 * `labelKey` reuses each domain's own `itemSingular` catalogue key (the
 * same one that names "New {itemSingular}" buttons on the NPC/deity list
 * pages) instead of a hardcoded "NPC"/"Deity" string here (TD-146).
 */

import type { LinkableEntityTypeConfig } from "@/app/modules/maps/types/poi";

export const LINKABLE_ENTITY_TYPES: LinkableEntityTypeConfig[] = [
  { id: "npc", labelKey: "npc.page.itemSingular", path: "/npc" },
  { id: "deity", labelKey: "deities.page.itemSingular", path: "/deities" },
];

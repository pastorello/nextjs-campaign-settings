/**
 * Place kind list (SPEC-004 §5.1). Declared in code, not user-extensible —
 * see `placeSchema.ts` for why this is a closed vocabulary rather than a
 * table (same reasoning as TD-61's option-backed fields).
 */

import type { PlaceKind } from "@/app/modules/maps/types/poi";

export const PLACE_KINDS: PlaceKind[] = ["region", "deity", "npc", "poi"];

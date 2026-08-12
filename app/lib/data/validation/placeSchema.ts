import { z } from "zod";

import { NAVIGABLE_PLACE_KINDS } from "@/app/modules/maps/constants/place-kinds";

const coordinatePair = z.tuple([z.number(), z.number()]);

/**
 * A navigable place — `region`, `plane`, `city` or `dungeon` (SPEC-004 T2),
 * a bigger place containing smaller ones. `kind: "poi"` (a landmark) never
 * reaches this schema: `MapPOIPanel`'s kind selector routes it through
 * `onAddPOI`/`createPoi` instead (see `createPlace.ts`), and `kind:
 * "deity"`/`"npc"` variants that used to live here were removed outright by
 * SPEC-008 T5 — the map no longer creates a pin for an entity. What's left
 * needing validation is only ever a navigable place, so this stopped being
 * a discriminated union once those other branches were gone (SPEC-008 T8).
 */
export const placeSchema = z.object({
  title: z.string().min(1),
  description: z.string().optional(),
  lat: z.number().finite(),
  lng: z.number().finite(),
  // Not kind-specific — every place other than the single universe root
  // (created outside this schema, `createRootPlace`/M4) has one.
  parentId: z.coerce.number().int().positive().nullable().optional(),
  kind: z.enum(NAVIGABLE_PLACE_KINDS),
  mapImage: z.string().min(1),
  mapBounds: z.tuple([coordinatePair, coordinatePair]).optional(),
  mapInitialView: coordinatePair.optional(),
  mapInitialZoom: z.number().int().optional(),
  // The rectangle this place casts on its parent's map (SPEC-009). Present
  // only when the place is being created as an area rather than a point.
  footprint: z.tuple([coordinatePair, coordinatePair]).optional(),
});

export type PlaceInput = z.infer<typeof placeSchema>;

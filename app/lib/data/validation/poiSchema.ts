import { z } from "zod";

import { POI_CATEGORIES } from "@/app/modules/maps/constants/poi-categories";
import type { POICategory } from "@/app/modules/maps/types/poi";

// Derived from the runtime list rather than repeating the union as string
// literals, so the two cannot drift apart — same pattern as
// `poiGeoJSONSchema` in `app/modules/maps/types/poiSchema.ts`.
const categoryIds = POI_CATEGORIES.map((c) => c.id) as [
  POICategory,
  ...POICategory[],
];

const poiFields = {
  title: z.string().min(1),
  description: z.string().optional(),
  // `finite()`, not Earth's ±90/±180. These maps are image overlays, not a
  // globe: `app/[locale]/dashboard/geography/page.tsx` declares bounds like
  // `[[0, 0], [1000, 1333]]`, so a marker's "lat"/"lng" are pixel-space
  // coordinates that routinely run into the hundreds. Geographic bounds were
  // the first thing written here and they rejected every POI the app can
  // actually place — caught by a round-trip against the real database, not
  // by the unit tests, whose fixtures happened to sit inside both ranges.
  // Each map declares its own bounds and Leaflet already clamps to them, so
  // the boundary's job here is only to reject what is not a number at all.
  lat: z.number().finite(),
  lng: z.number().finite(),
  category: z.enum(categoryIds),
  // A landmark always belongs to exactly one zone (SPEC-008 §6/T8) —
  // required, not optional, unlike the `parentId` this replaces: a poi row
  // can no longer exist outside the tree the way a pre-M7 one could.
  zoneId: z.coerce.number().int().positive(),
};

/**
 * Full-object schema for a create payload (TD-14 / SPEC-002).
 */
export function buildPoiCreateSchema() {
  return z.object(poiFields);
}

/**
 * Schema for an update payload: every field optional except `id`, since an
 * update only carries the fields the user edited — mirrors
 * `buildEntitySchema.buildUpdateSchema`, which POI does not use directly
 * because it sits outside the metadata layer (SPEC-002 §7).
 */
export function buildPoiUpdateSchema() {
  return z
    .object(poiFields)
    .partial()
    .extend({ id: z.coerce.number().int().positive() });
}

import { z } from "zod";

import { POI_CATEGORIES } from "@/app/modules/maps/constants/poi-categories";
import type { POICategory } from "@/app/modules/maps/types/poi";

// Derived from the runtime category list rather than repeating the
// `POICategory` union as string literals, so the two cannot drift apart.
const categoryIds = POI_CATEGORIES.map((c) => c.id) as [
  POICategory,
  ...POICategory[],
];

/**
 * Validates a POI read back from `localStorage` (TD-02b). Hand-edited or
 * stale storage should not crash the map — callers discard entries that fail
 * this and keep the rest.
 */
export const poiSchema = z.object({
  id: z.string(),
  title: z.string(),
  description: z.string().optional(),
  lat: z.number(),
  lng: z.number(),
  category: z.enum(categoryIds),
  createdAt: z.number(),
  updatedAt: z.number(),
});

/**
 * Validates a `.geojson` file dropped in through the "import places" dialog
 * (TD-02b) — user-supplied, not the app's own export. `id`, `createdAt` and
 * `updatedAt` stay optional: `usePOIManager.importGeoJSON` already fills them
 * in when absent, and rejecting a file over a missing timestamp would be
 * stricter than the app's own behaviour.
 */
export const poiGeoJSONSchema = z.object({
  type: z.literal("FeatureCollection"),
  features: z.array(
    z.object({
      type: z.literal("Feature"),
      geometry: z.object({
        type: z.literal("Point"),
        coordinates: z.tuple([z.number(), z.number()]),
      }),
      properties: z.object({
        id: z.string().optional(),
        title: z.string(),
        description: z.string().optional(),
        category: z.enum(categoryIds),
        createdAt: z.number().optional(),
        updatedAt: z.number().optional(),
      }),
    })
  ),
});

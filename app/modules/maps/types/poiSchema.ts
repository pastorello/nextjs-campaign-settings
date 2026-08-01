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
 * Validates a `.geojson` file dropped in through the "import places" dialog
 * (TD-02b) — user-supplied, not the app's own export. `id`, `createdAt` and
 * `updatedAt` stay optional: `usePOIManager.importGeoJSON` already fills them
 * in when absent, and rejecting a file over a missing timestamp would be
 * stricter than the app's own behaviour.
 *
 * The sibling `poiSchema`, which validated a POI read back from
 * `localStorage`, was removed with TD-14 / SPEC-002: POIs are read from
 * Postgres now (`app/lib/data/maps/fetchPois.ts`), which has its own
 * boundary (`app/lib/data/validation/poiSchema.ts`).
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

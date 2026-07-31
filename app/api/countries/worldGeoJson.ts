import { z } from "zod";

/**
 * Shape of `public/data/world.geojson`, validated once it is read off disk
 * (TD-02b). Both route handlers below parse the same file; a corrupt or
 * hand-edited copy should produce a clear error instead of an unchecked cast
 * that only fails later, deep in whichever field happened to be read.
 */
const worldFeatureSchema = z.object({
  type: z.string(),
  properties: z
    .object({
      NAME: z.string().optional(),
      NAME_LONG: z.string().optional(),
    })
    .catchall(z.unknown()),
  geometry: z.record(z.string(), z.unknown()),
});

export const worldGeoJSONSchema = z.object({
  type: z.string(),
  features: z.array(worldFeatureSchema),
});

export type WorldGeoJSON = z.infer<typeof worldGeoJSONSchema>;
export type WorldGeoJSONFeature = z.infer<typeof worldFeatureSchema>;

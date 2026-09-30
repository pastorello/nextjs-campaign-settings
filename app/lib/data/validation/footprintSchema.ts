import { z } from "zod";

const vertex = z.tuple([z.number().finite(), z.number().finite()]);

/**
 * An area's outline at the boundary (SPEC-024 §6): one ring of three or more
 * `[lat, lng]` vertices, stored open. The shape's own validity — a simple
 * polygon, not a sliver — is `checkAreaPlacement`'s to judge, with named
 * refusals, because both need the parent map and the geometry of
 * `footprint.ts`; this only refuses what is not an outline at all.
 *
 * Shared by `placeSchema` (creation) and `updateZonePosition` (a redraw), so
 * the two cannot accept different shapes.
 */
export const footprintSchema = z.object({
  ring: z.array(vertex).min(3),
});

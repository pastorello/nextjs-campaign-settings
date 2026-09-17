import { z } from "zod";

import zoneMeta from "@/app/lib/config/geography/zoneMeta";

/**
 * The "create your world" flow (SPEC-004 §5.1/§10 M4): name the world and
 * upload its map. Deliberately not `placeSchema.ts`'s `region` variant —
 * that one is for a region *with a parent* (M5's "add a place from the
 * map"), while the root has none, ever, by construction. `mapImage` is the
 * id `POST /api/maps/upload` (M1) returned, not a file. `title` comes from
 * `zoneMeta` (TD-129), same as `placeSchema`/`poiSchema` — the root is a
 * `zone` row too.
 */
export function buildRootPlaceSchema() {
  return z.object({
    title: zoneMeta.title.validator,
    mapImage: z.string().min(1),
  });
}

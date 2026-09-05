"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import MutationResult from "@/app/lib/definitions/types/MutationResult";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { checkAreaPlacement, checkPointPlacement } from "./checkPlacement";
import { footprintCentre } from "@/app/modules/maps/lib/utils/footprint";

const coordinatePair = z.tuple([z.number().finite(), z.number().finite()]);

const positionSchema = z.object({
  id: z.coerce.number().int().positive(),
  lat: z.number().finite(),
  lng: z.number().finite(),
});

const footprintSchema = z.object({
  id: z.coerce.number().int().positive(),
  footprint: z.tuple([coordinatePair, coordinatePair]),
});

const inputSchema = z.union([footprintSchema, positionSchema]);

/**
 * Repositions or resizes a Zone (TD-71, SPEC-005 §5.B; SPEC-009 T5). Two
 * shapes:
 *
 * - `{ id, lat, lng }` — moves a point that is already on the map, from
 *   dragging a navigable marker (`useNavigableChildren`, SPEC-005 §5.A).
 *   **Placing** a point that has none is `placeZone`, split out by
 *   SPEC-017 T3: it writes the tree edge alongside the coordinates and
 *   refuses a row that is already positioned. The two used to share this
 *   function under an `intent` discriminator (TD-93) — the discriminator is
 *   gone because the two acts are now two functions.
 * - `{ id, footprint }` — resizes/moves an area, re-drawing its rectangle
 *   (`WorldMap`'s area-edit flow, SPEC-009 T5). The derived centre
 *   (`footprintCentre`) is recomputed and written alongside it, the same way
 *   `createPlace` derives it at creation (SPEC-009 T1).
 *
 * Both re-run SPEC-009 §7's checks against the zone's own siblings —
 * `checkPlacement.ts`, shared with `createPlace`/`createPoi` — passing
 * `excludeZoneId: id` so the row being repositioned doesn't collide with
 * itself in the sibling query. This was SPEC-009 §8's documented gap: this
 * mutation used to write `lat`/`lng` with no check at all, so dragging an
 * already-placed pin into an area, or resizing an area over a pin or a
 * sibling, was still possible from outside the normal UI flow.
 *
 * Split from `updatePoi` because SPEC-008 T8 split the table itself: a
 * navigable place lives in `zone` now, not `poi`.
 */
export default async function updateZonePosition(
  formData:
    | { id: number; lat: number; lng: number }
    | { id: number; footprint: [[number, number], [number, number]] }
): Promise<MutationResult> {
  await requireSession();

  const parsed = inputSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }
  const data = parsed.data;

  let zone: { parentId: number | null } | null;
  try {
    zone = await prisma.zone.findUnique({
      where: { id: data.id },
      select: { parentId: true },
    });
  } catch (error) {
    throw toDatabaseError("repositioning zone", error);
  }
  const parentId = zone?.parentId ?? null;

  if ("footprint" in data) {
    // The root is the one row with no parent (SPEC-009 §6) — there is no
    // surface to cast a footprint onto, so it cannot be resized as an area.
    if (parentId == null) {
      return {
        ok: false,
        errors: {
          footprint: ["The root place has no parent to draw an area against."],
        },
      };
    }

    const errors = await checkAreaPlacement({
      parentId,
      footprint: data.footprint,
      excludeZoneId: data.id,
    });
    if (errors) return { ok: false, errors };

    const [lat, lng] = footprintCentre(data.footprint);
    try {
      await prisma.zone.update({
        where: { id: data.id },
        data: { lat, lng, footprint: data.footprint },
      });
    } catch (error) {
      throw toDatabaseError("repositioning zone", error);
    }
  } else {
    if (parentId != null) {
      const errors = await checkPointPlacement({
        parentId,
        point: [data.lat, data.lng],
        excludeZoneId: data.id,
      });
      if (errors) return { ok: false, errors };
    }

    try {
      await prisma.zone.update({
        where: { id: data.id },
        data: { lat: data.lat, lng: data.lng },
      });
    } catch (error) {
      throw toDatabaseError("repositioning zone", error);
    }
  }

  revalidatePath("/dashboard/geography");
  return { ok: true };
}

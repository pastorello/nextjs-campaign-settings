"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { checkAreaPlacement, checkPointPlacement } from "./checkPlacement";
import { footprintCentre } from "@/app/modules/maps/lib/utils/footprint";
import { placeSchema, type PlaceInput } from "../validation/placeSchema";
import type { CreatePlaceResult } from "../../definitions/interfaces/maps/Place";

/**
 * Creates a navigable place (`region`/`plane`/`city`/`dungeon`) under an
 * existing parent (SPEC-004 §10 M5, T2) — `MapPOIPanel`'s kind selector
 * calls this once a kind other than `poi` is chosen. `kind: "poi"` keeps
 * going through `createPoi` unchanged, writing a landmark, not a zone.
 *
 * Targets `zone`, not `poi` (SPEC-008 T8): the navigable kinds live in
 * `zone` now — `placeSchema` no longer accepts anything else (T5 already
 * removed `kind: "deity"`/`"npc"`, and `kind: "poi"` was always routed
 * elsewhere in practice, so the schema stopped being a discriminated union).
 *
 * Never creates the root: `parentId` is required here, where `placeSchema`
 * itself allows it to be absent (the root is `createRootPlace`'s job, M4).
 */
export default async function createPlace(
  formData: PlaceInput
): Promise<CreatePlaceResult> {
  await requireSession();

  const parsed = placeSchema.safeParse(formData);
  if (!parsed.success) {
    return { ok: false, errors: parsed.error.flatten().fieldErrors };
  }

  const data = parsed.data;
  if (data.parentId == null) {
    return { ok: false, errors: { parentId: ["A place needs a parent."] } };
  }

  let lat = data.lat;
  let lng = data.lng;

  // SPEC-009 §7 — the server check is the rule; the client's own check (T2)
  // is only a convenience. `checkPlacement.ts` holds both branches: drawing
  // an area must not overlap a sibling area or swallow an existing pin, and
  // placing a point must not land inside a sibling area. `updateZonePosition`
  // (T5) shares the same two functions.
  if (data.footprint !== undefined) {
    const errors = await checkAreaPlacement({
      parentId: data.parentId,
      footprint: data.footprint,
    });
    if (errors) return { ok: false, errors };

    [lat, lng] = footprintCentre(data.footprint);
  } else {
    const errors = await checkPointPlacement({
      parentId: data.parentId,
      point: [lat, lng],
    });
    if (errors) return { ok: false, errors };
  }

  let created;
  try {
    created = await prisma.zone.create({
      data: {
        title: data.title,
        lat,
        lng,
        kind: data.kind,
        parentId: data.parentId,
        mapImage: data.mapImage,
        ...(data.description !== undefined && {
          description: data.description,
        }),
        ...(data.mapBounds !== undefined && { mapBounds: data.mapBounds }),
        ...(data.mapInitialView !== undefined && {
          mapInitialView: data.mapInitialView,
        }),
        ...(data.mapInitialZoom !== undefined && {
          mapInitialZoom: data.mapInitialZoom,
        }),
        ...(data.footprint !== undefined && { footprint: data.footprint }),
      },
    });
  } catch (error) {
    throw toDatabaseError("creating place", error);
  }

  revalidatePath("/dashboard/geography");
  return { ok: true, id: created.id };
}

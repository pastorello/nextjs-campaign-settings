"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { placeSchema, type PlaceInput } from "../validation/placeSchema";
import type { CreatePlaceResult } from "../../definitions/interfaces/maps/Place";

/**
 * Creates a place under an existing parent (SPEC-004 §10 M5, T2) —
 * `MapPOIPanel`'s kind selector calls this once a kind other than `poi` is
 * chosen. `kind: "poi"` keeps going through `createPoi`
 * unchanged: `placeSchema`'s `poi` variant forbids a link, which would
 * silently narrow the optional-link feature SPEC-002 shipped (and
 * `map-poi-link.spec.ts` still exercises) — a real product change, not
 * something to fold into wiring the kind selector in.
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

  let created;
  try {
    created = await prisma.poi.create({
      data: {
        title: data.title,
        lat: data.lat,
        lng: data.lng,
        kind: data.kind,
        parentId: data.parentId,
        ...(data.description !== undefined && {
          description: data.description,
        }),
        // Spelled out as literal equalities rather than
        // `isNavigablePlaceKind(data.kind)`: the helper's type predicate
        // doesn't narrow `data`'s zod-inferred discriminated union here the
        // way a direct literal comparison does, and the union member this
        // block depends on (`mapImage` etc.) needs that narrowing.
        ...((data.kind === "region" ||
          data.kind === "plane" ||
          data.kind === "city" ||
          data.kind === "dungeon") && {
          mapImage: data.mapImage,
          ...(data.mapBounds !== undefined && { mapBounds: data.mapBounds }),
          ...(data.mapInitialView !== undefined && {
            mapInitialView: data.mapInitialView,
          }),
          ...(data.mapInitialZoom !== undefined && {
            mapInitialZoom: data.mapInitialZoom,
          }),
        }),
        ...((data.kind === "deity" || data.kind === "npc") && {
          linkedType: data.linkedType,
          linkedId: data.linkedId,
        }),
        ...(data.kind === "poi" && { category: data.category }),
      },
    });
  } catch (error) {
    throw toDatabaseError("creating place", error);
  }

  revalidatePath("/dashboard/geography");
  return { ok: true, id: created.id };
}

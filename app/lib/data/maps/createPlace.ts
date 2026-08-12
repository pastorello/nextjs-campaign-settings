"use server";

import { revalidatePath } from "next/cache";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import {
  findContainingSibling,
  findOverlappingSibling,
  findSwallowedPins,
  footprintCentre,
  isDegenerateFootprint,
  type Footprint,
} from "@/app/modules/maps/lib/utils/footprint";
import { parsePlaceMapBounds } from "@/app/modules/maps/lib/utils/placeMapView";
import { placeSchema, type PlaceInput } from "../validation/placeSchema";
import type { CreatePlaceResult } from "../../definitions/interfaces/maps/Place";

function isFootprint(value: unknown): value is Footprint {
  return Array.isArray(value) && value.length === 2;
}

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
  // is only a convenience. Two branches, sharing `footprint.ts`'s predicates:
  // drawing an area must not overlap a sibling area or swallow an existing
  // pin, and placing a point must not land inside a sibling area.
  if (data.footprint !== undefined) {
    let parent, siblingZones, siblingPois;
    try {
      [parent, siblingZones, siblingPois] = await Promise.all([
        prisma.zone.findUnique({
          where: { id: data.parentId },
          select: { mapBounds: true },
        }),
        prisma.zone.findMany({
          where: { parentId: data.parentId },
          select: { title: true, lat: true, lng: true, footprint: true },
        }),
        prisma.poi.findMany({
          where: { zoneId: data.parentId },
          select: { title: true, lat: true, lng: true },
        }),
      ]);
    } catch (error) {
      throw toDatabaseError("checking the area against its siblings", error);
    }

    const parentBounds = parsePlaceMapBounds(
      parent?.mapBounds
    ) as unknown as Footprint;
    if (isDegenerateFootprint(data.footprint, parentBounds)) {
      return {
        ok: false,
        errors: { footprint: ["This area is too small to draw."] },
      };
    }

    const areaSiblings = siblingZones
      .filter((zone) => isFootprint(zone.footprint))
      .map((zone) => ({
        title: zone.title,
        footprint: zone.footprint as Footprint,
      }));
    const overlapping = findOverlappingSibling(data.footprint, areaSiblings);
    if (overlapping) {
      return {
        ok: false,
        errors: {
          footprint: [`Overlaps an existing area: ${overlapping.title}.`],
        },
      };
    }

    const pins = [
      ...siblingZones
        .filter(
          (zone): zone is typeof zone & { lat: number; lng: number } =>
            !isFootprint(zone.footprint) &&
            zone.lat !== null &&
            zone.lng !== null
        )
        .map((zone) => ({ title: zone.title, lat: zone.lat, lng: zone.lng })),
      ...siblingPois,
    ];
    const swallowed = findSwallowedPins(data.footprint, pins);
    if (swallowed.length > 0) {
      return {
        ok: false,
        errors: {
          footprint: [
            `Would cover existing place(s): ${swallowed.map((pin) => pin.title).join(", ")}.`,
          ],
        },
      };
    }

    [lat, lng] = footprintCentre(data.footprint);
  } else {
    let siblingZones;
    try {
      siblingZones = await prisma.zone.findMany({
        where: { parentId: data.parentId },
        select: { title: true, footprint: true },
      });
    } catch (error) {
      throw toDatabaseError("checking the point against sibling areas", error);
    }

    const areaSiblings = siblingZones
      .filter((zone) => isFootprint(zone.footprint))
      .map((zone) => ({
        title: zone.title,
        footprint: zone.footprint as Footprint,
      }));
    const containing = findContainingSibling([lat, lng], areaSiblings);
    if (containing) {
      return {
        ok: false,
        errors: {
          lat: [`This point is inside an existing area: ${containing.title}.`],
        },
      };
    }
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

import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import {
  findContainingSibling,
  findOverlappingSibling,
  findSwallowedPins,
  isDegenerateFootprint,
  isFootprint,
  type Footprint,
  type Point,
} from "@/app/modules/maps/lib/utils/footprint";
import { parsePlaceMapBounds } from "@/app/modules/maps/lib/utils/placeMapView";

export type PlacementErrors = Record<string, string[]>;

/**
 * SPEC-009 §7's two checks — shared by `createPlace`, `createPoi` and
 * `updateZonePosition` (T5) so the predicate lives once rather than three
 * times (TD-77 is exactly this failure shape: two copies of one rule
 * drifting apart). `excludeZoneId` leaves the row being repositioned out of
 * its own sibling set: without it, resizing an existing area finds it
 * "overlapping" itself via `findOverlappingSibling` and every resize is
 * refused. Create has no such row yet, so create call sites simply omit it.
 */
export async function checkAreaPlacement({
  parentId,
  footprint,
  excludeZoneId,
}: {
  parentId: number;
  footprint: Footprint;
  excludeZoneId?: number;
}): Promise<PlacementErrors | null> {
  let parent, siblingZones, siblingPois;
  try {
    [parent, siblingZones, siblingPois] = await Promise.all([
      prisma.zone.findUnique({
        where: { id: parentId },
        select: { mapBounds: true },
      }),
      prisma.zone.findMany({
        where: {
          parentId,
          ...(excludeZoneId !== undefined && { id: { not: excludeZoneId } }),
        },
        select: { title: true, lat: true, lng: true, footprint: true },
      }),
      prisma.poi.findMany({
        where: { zoneId: parentId },
        select: { title: true, lat: true, lng: true },
      }),
    ]);
  } catch (error) {
    throw toDatabaseError("checking the area against its siblings", error);
  }

  const parentBounds = parsePlaceMapBounds(
    parent?.mapBounds
  ) as unknown as Footprint;
  if (isDegenerateFootprint(footprint, parentBounds)) {
    return { footprint: ["This area is too small to draw."] };
  }

  const areaSiblings = siblingZones
    .filter((zone) => isFootprint(zone.footprint))
    .map((zone) => ({
      title: zone.title,
      footprint: zone.footprint as Footprint,
    }));
  const overlapping = findOverlappingSibling(footprint, areaSiblings);
  if (overlapping) {
    return {
      footprint: [`Overlaps an existing area: ${overlapping.title}.`],
    };
  }

  const pins = [
    ...siblingZones
      .filter(
        (zone): zone is typeof zone & { lat: number; lng: number } =>
          !isFootprint(zone.footprint) && zone.lat !== null && zone.lng !== null
      )
      .map((zone) => ({ title: zone.title, lat: zone.lat, lng: zone.lng })),
    // A landmark can be unpositioned (SPEC-010 T1) — nothing to swallow if
    // it has no point yet.
    ...siblingPois.filter(
      (poi): poi is typeof poi & { lat: number; lng: number } =>
        poi.lat !== null && poi.lng !== null
    ),
  ];
  const swallowed = findSwallowedPins(footprint, pins);
  if (swallowed.length > 0) {
    return {
      footprint: [
        `Would cover existing place(s): ${swallowed.map((pin) => pin.title).join(", ")}.`,
      ],
    };
  }

  return null;
}

/**
 * The point half of the same pair — used when placing or repositioning a
 * pin (a child place or a landmark), never an area. See `checkAreaPlacement`
 * for why `excludeZoneId` exists.
 */
export async function checkPointPlacement({
  parentId,
  point,
  excludeZoneId,
}: {
  parentId: number;
  point: Point;
  excludeZoneId?: number;
}): Promise<PlacementErrors | null> {
  let siblingZones;
  try {
    siblingZones = await prisma.zone.findMany({
      where: {
        parentId,
        ...(excludeZoneId !== undefined && { id: { not: excludeZoneId } }),
      },
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
  const containing = findContainingSibling(point, areaSiblings);
  if (containing) {
    return {
      lat: [`This point is inside an existing area: ${containing.title}.`],
    };
  }

  return null;
}

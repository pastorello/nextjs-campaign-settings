"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import type PlaceChild from "../../definitions/interfaces/maps/PlaceChild";

/**
 * Every place pinned directly under `parentId` (SPEC-004 §10 M6) — the fix
 * for §1's defect: reading every row with no filter meant a pin placed
 * under one parent rendered on every map. A scoped read is how a pin ends
 * up on only the map it was placed on.
 *
 * Reads two tables and merges them (SPEC-008 T8): navigable children
 * (`zone` rows with `parentId`) and landmark children (`poi` rows with
 * `zoneId`) used to be one polymorphic table before the split. A landmark
 * can be unplaced the same way a zone can (SPEC-010 T1, §9): deleting its
 * zone reparents it to the grandparent and clears its position.
 */
export default async function fetchPlaceChildren(
  parentId: number
): Promise<PlaceChild[]> {
  await requireSession();

  let zoneRows, poiRows;
  try {
    [zoneRows, poiRows] = await Promise.all([
      prisma.zone.findMany({
        where: { parentId },
        orderBy: { createdAt: "asc" },
      }),
      prisma.poi.findMany({
        where: { zoneId: parentId },
        orderBy: { createdAt: "asc" },
      }),
    ]);
  } catch (error) {
    throw toDatabaseError("fetching place children", error);
  }

  const zoneChildren: PlaceChild[] = zoneRows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    kind: row.kind,
    lat: row.lat,
    lng: row.lng,
    category: null,
    mapImage: row.mapImage,
    mapBounds: row.mapBounds,
    mapInitialView: row.mapInitialView,
    mapInitialZoom: row.mapInitialZoom,
    footprint: row.footprint,
    gridColumns: row.gridColumns,
    gridScale: row.gridScale,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  const poiChildren: PlaceChild[] = poiRows.map((row) => ({
    id: row.id,
    title: row.title,
    description: row.description,
    kind: "poi",
    lat: row.lat,
    lng: row.lng,
    category: row.category,
    mapImage: null,
    mapBounds: null,
    mapInitialView: null,
    mapInitialZoom: null,
    footprint: null,
    gridColumns: null,
    gridScale: null,
    createdAt: row.createdAt,
    updatedAt: row.updatedAt,
  }));

  return [...zoneChildren, ...poiChildren];
}

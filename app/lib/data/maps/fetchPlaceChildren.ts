"use server";

import prisma from "@/app/lib/connections/prisma";
import requireSession from "@/app/lib/auth/requireSession";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import { isLinkableEntityType } from "@/app/modules/maps/constants/linkable-entities";
import type { LinkableEntityType } from "@/app/modules/maps/types/poi";
import type PlaceChild from "../../definitions/interfaces/maps/PlaceChild";

// Duplicated from `fetchPois.ts` rather than shared: that reader is
// SPEC-002's legacy, unscoped one, kept exactly as it worked before this
// milestone (SPEC-004 M1-M4's whole MVP is additive, nothing existing
// changes underneath it). Extracting a shared helper would mean touching
// its stable, already-tested code for a two-caller saving.
async function findValidIds(
  linkedType: LinkableEntityType,
  ids: number[]
): Promise<Set<number>> {
  if (ids.length === 0) return new Set();

  const rows =
    linkedType === "npc"
      ? await prisma.npc.findMany({
          where: { id: { in: ids } },
          select: { id: true },
        })
      : await prisma.deities.findMany({
          where: { id: { in: ids } },
          select: { id: true },
        });

  return new Set(rows.map((row) => row.id));
}

/**
 * Every place pinned directly under `parentId` (SPEC-004 §10 M6) — the fix
 * for §1's defect: `fetchPois` reads every row with no filter, so a pin
 * placed under one parent rendered on every map. A scoped read is how a pin
 * ends up on only the map it was placed on.
 *
 * Not yet called from any component — M7 wires "which place is currently
 * being viewed" into the geography page and calls this with that id.
 */
export default async function fetchPlaceChildren(
  parentId: number
): Promise<PlaceChild[]> {
  await requireSession();

  let rows;
  try {
    rows = await prisma.poi.findMany({
      where: { parentId },
      orderBy: { createdAt: "asc" },
    });
  } catch (error) {
    throw toDatabaseError("fetching place children", error);
  }

  const npcIds: number[] = [];
  const deityIds: number[] = [];
  for (const row of rows) {
    if (row.linkedType === "npc" && row.linkedId != null) {
      npcIds.push(row.linkedId);
    }
    if (row.linkedType === "deity" && row.linkedId != null) {
      deityIds.push(row.linkedId);
    }
  }

  let validNpcIds: Set<number>;
  let validDeityIds: Set<number>;
  try {
    [validNpcIds, validDeityIds] = await Promise.all([
      findValidIds("npc", npcIds),
      findValidIds("deity", deityIds),
    ]);
  } catch (error) {
    throw toDatabaseError("resolving place links", error);
  }

  return rows.map((row): PlaceChild => {
    const { linkedType, linkedId } = row;
    const isValidLink =
      linkedType != null &&
      isLinkableEntityType(linkedType) &&
      linkedId != null &&
      (linkedType === "npc" ? validNpcIds : validDeityIds).has(linkedId);

    return {
      id: row.id,
      title: row.title,
      description: row.description,
      kind: row.kind,
      lat: row.lat,
      lng: row.lng,
      category: row.category,
      linkedType: isValidLink ? linkedType : null,
      linkedId: isValidLink ? linkedId : null,
      mapImage: row.mapImage,
      mapBounds: row.mapBounds,
      mapInitialView: row.mapInitialView,
      mapInitialZoom: row.mapInitialZoom,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    };
  });
}

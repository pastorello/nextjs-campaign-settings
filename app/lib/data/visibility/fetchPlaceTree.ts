import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

import type { PlaceTree } from "./placeTree";

const toIds = (campaigns: { id: number }[]) =>
  new Set(campaigns.map(({ id }) => id));

/** Reads the whole world tree with its reveals (see `PlaceTree`). */
export default async function fetchPlaceTree(): Promise<PlaceTree> {
  let zones, pois;
  try {
    [zones, pois] = await Promise.all([
      prisma.zone.findMany({
        select: {
          id: true,
          parentId: true,
          title: true,
          revealedTo: { select: { id: true } },
        },
      }),
      prisma.poi.findMany({
        select: {
          id: true,
          zoneId: true,
          title: true,
          revealedTo: { select: { id: true } },
        },
      }),
    ]);
  } catch (error) {
    throw toDatabaseError("reading the world tree's reveals", error);
  }

  return {
    zones: new Map(
      zones.map((zone) => [
        zone.id,
        {
          parentId: zone.parentId,
          title: zone.title,
          revealedTo: toIds(zone.revealedTo),
        },
      ])
    ),
    pois: new Map(
      pois.map((poi) => [
        poi.id,
        {
          zoneId: poi.zoneId,
          title: poi.title,
          revealedTo: toIds(poi.revealedTo),
        },
      ])
    ),
  };
}

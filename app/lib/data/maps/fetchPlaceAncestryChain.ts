import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";

/** One place's own row shape, as needed to seed `GeographyExplorer`'s stack. */
export interface PlaceAncestryZone {
  id: number;
  title: string;
  parentId: number | null;
  mapImage: string | null;
  mapBounds: unknown;
  mapInitialView: unknown;
  mapInitialZoom: number | null;
  gridColumns: number | null;
  gridScale: string | null;
}

/**
 * The ancestor chain of a place itself, root first and the place last
 * (SPEC-011 T4) — distinct from `fetchDerivedAncestry`, which walks the
 * chain of an entity's *assigned* location rather than an arbitrary place
 * id. Feeds `GeographyExplorer`'s initial navigation stack (via
 * `toStackEntry`) when a cross-entity place search result lands somewhere
 * other than the root.
 *
 * Reads the whole zone table once and walks it in memory — the same "read
 * once, index in memory" shape `deriveEntityAncestry`/`fetchDerivedAncestry`
 * use, cheap at this DM's tree size and avoiding N queries for an N-deep
 * chain.
 *
 * Returns `null` when `id` does not resolve to any zone at all — the
 * caller's signal to fall back to root-only navigation rather than a 500,
 * covering both a deleted place (the search link's target vanished between
 * being generated and clicked) and a garbage `?place=` value. A broken or
 * cyclic `parentId` chain reached partway up stops there rather than
 * hanging, the same defensive rule `deriveEntityAncestry` follows and for
 * the same reason: the mutation boundary prevents a cycle from being
 * written, but a corrupt row must not hang a render.
 */
export default async function fetchPlaceAncestryChain(
  id: number
): Promise<PlaceAncestryZone[] | null> {
  let zones;
  try {
    zones = await prisma.zone.findMany({
      select: {
        id: true,
        title: true,
        parentId: true,
        mapImage: true,
        mapBounds: true,
        mapInitialView: true,
        mapInitialZoom: true,
        gridColumns: true,
        gridScale: true,
      },
    });
  } catch (error) {
    throw toDatabaseError("resolving a place's ancestry chain", error);
  }

  const zoneById = new Map(zones.map((zone) => [zone.id, zone]));
  if (!zoneById.has(id)) return null;

  const chain: PlaceAncestryZone[] = [];
  const seen = new Set<number>();
  let currentId: number | null = id;
  while (currentId !== null && !seen.has(currentId)) {
    const zone = zoneById.get(currentId);
    if (zone === undefined) break;
    seen.add(zone.id);
    chain.push(zone);
    currentId = zone.parentId;
  }

  return chain.reverse();
}

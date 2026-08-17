import {
  parsePlaceMapBounds,
  parsePlaceMapInitialView,
  parsePlaceMapInitialZoom,
} from "@/app/modules/maps/lib/utils/placeMapView";

export interface PlaceStackEntry {
  id: number;
  title: string;
  // Empty for a positioned place with no map of its own yet (SPEC-007 T1) —
  // `WorldMap` renders empty ground with `MapUploadControl` on it rather
  // than an image overlay.
  mapUrl: string;
  bounds: L.LatLngBoundsExpression;
  initialView: L.LatLngExpression;
  initialZoom: number;
}

/**
 * Shared between `GeographyExplorer` (a `"use client"` component, descending
 * the tree one click at a time) and the geography page's `?place=<id>`
 * handling (a Server Component, seeding a whole ancestor chain from
 * `fetchPlaceAncestryChain` at once — SPEC-011 T4): a stack built by
 * clicking through the tree and one seeded from a search result must be
 * shaped identically.
 *
 * Deliberately **not** defined inside `GeographyExplorer.tsx`. Every export
 * of a `"use client"` file becomes a client reference — even a plain,
 * side-effect-free function — so a Server Component cannot call it directly;
 * doing so throws at request time ("Attempted to call toStackEntry() from
 * the server but toStackEntry is on the client"), a class of error
 * `pnpm typecheck`/`pnpm lint` cannot catch, since it is a Next.js
 * server/client boundary rule, not a type error. This file has no
 * directive, so it is a plain module either side can import.
 */
export default function toStackEntry(place: {
  id: number;
  title: string;
  mapImage: string | null;
  mapBounds: unknown;
  mapInitialView: unknown;
  mapInitialZoom: number | null;
}): PlaceStackEntry {
  return {
    id: place.id,
    title: place.title,
    mapUrl: place.mapImage ? `/api/maps/${place.mapImage}/image` : "",
    bounds: parsePlaceMapBounds(place.mapBounds),
    initialView: parsePlaceMapInitialView(place.mapInitialView),
    initialZoom: parsePlaceMapInitialZoom(place.mapInitialZoom),
  };
}

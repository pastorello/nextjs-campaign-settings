import { z } from "zod";

/**
 * How to frame a place's own map (SPEC-004 M7). `mapBounds`/`mapInitialView`
 * are stored as Postgres `Json` — nothing writes them yet (no UI sets them;
 * M4's "create your world" only sets `title`/`mapImage`), so every reader
 * parses defensively and falls back to a default rather than trusting the
 * shape a future writer might not honour either.
 */

const coordinatePair = z.tuple([z.number(), z.number()]);
const boundsSchema = z.tuple([coordinatePair, coordinatePair]);

// A generous default comfortably larger than any of the legacy hardcoded
// maps' bounds (the widest is `[[0,0],[1000,1333]]` — see
// `geography/page.tsx`'s pre-M7 history). Not tuned to any real image's
// pixel size, because nothing lets a DM set that yet.
export const DEFAULT_MAP_BOUNDS: L.LatLngBoundsExpression = [
  [0, 0],
  [2000, 2000],
];
export const DEFAULT_MAP_INITIAL_VIEW: L.LatLngExpression = [1000, 1000];
export const DEFAULT_MAP_INITIAL_ZOOM = -2;

export function parsePlaceMapBounds(value: unknown): L.LatLngBoundsExpression {
  const parsed = boundsSchema.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_MAP_BOUNDS;
}

export function parsePlaceMapInitialView(value: unknown): L.LatLngExpression {
  const parsed = coordinatePair.safeParse(value);
  return parsed.success ? parsed.data : DEFAULT_MAP_INITIAL_VIEW;
}

export function parsePlaceMapInitialZoom(value: number | null): number {
  return value ?? DEFAULT_MAP_INITIAL_ZOOM;
}

/**
 * TD-81: once a map's image has actually loaded, its natural pixel
 * dimensions are the only trustworthy source for framing — nothing writes
 * `mapBounds` correctly yet (see the module doc comment above), so the
 * stored/default bounds above only serve as an interim placeholder until
 * the image reports its own size. `WorldMap` applies this once the image's
 * `load` event fires.
 */

/**
 * The bounds that render an image of these pixel dimensions at 1:1 on every
 * axis — no stretch — in Leaflet's `L.CRS.Simple` `[y, x]` convention (the
 * same one `DEFAULT_MAP_BOUNDS` above uses: `[[0,0],[height,width]]`).
 */
export function computeImageBounds(
  naturalWidth: number,
  naturalHeight: number
): L.LatLngBoundsExpression {
  return [
    [0, 0],
    [naturalHeight, naturalWidth],
  ];
}

/**
 * TD-87: every map used to open with `setMinZoom(0)` then a view clamped up
 * to that same `0` — pinning the map exactly at its own floor, so "zoom out"
 * had nothing to do. The floor a map opens with has to sit strictly below
 * the zoom it is about to be shown at, or Leaflet's own `setView`/
 * `fitBounds` silently clamps that opening zoom *up* to the floor and
 * reproduces the same bug with a different number.
 *
 * `fitZoom` is `Map.getBoundsZoom(bounds)` — the zoom at which the whole
 * image exactly fills the container, i.e. the real floor: below it there is
 * nothing left to see, only blank canvas. `openZoom` is whatever zoom the
 * map is about to display. Taking the lower of "one step below the opening
 * zoom" and the real fit guarantees genuine headroom to zoom out from
 * wherever the map opens, while never raising the floor above the point
 * where the whole image is visible.
 */
export function computeMinZoom(fitZoom: number, openZoom: number): number {
  return Math.min(fitZoom, openZoom - 1);
}

/**
 * Geometry for `zone.footprint` (SPEC-009): the rectangle a place casts on
 * its parent's map. No geographic assumptions — unlike `isValidBounds`, these
 * bounds come from uploaded map images and can exceed lat ±90 / lng ±180.
 */

export type Footprint = [[number, number], [number, number]];
export type Point = [number, number];

function orderedBounds(footprint: Footprint) {
  const [[lat1, lng1], [lat2, lng2]] = footprint;
  return {
    minLat: Math.min(lat1, lat2),
    maxLat: Math.max(lat1, lat2),
    minLng: Math.min(lng1, lng2),
    maxLng: Math.max(lng1, lng2),
  };
}

/**
 * Point-in-rectangle containment: a **closed** set, a point exactly on the
 * edge is inside. This is deliberately not the same rule as
 * `footprintsOverlap` — see the comment there for why the two differ.
 */
export function footprintContains(footprint: Footprint, point: Point): boolean {
  const { minLat, maxLat, minLng, maxLng } = orderedBounds(footprint);
  const [lat, lng] = point;
  return lat >= minLat && lat <= maxLat && lng >= minLng && lng <= maxLng;
}

/**
 * Rectangle overlap, tested on **open interiors**: two areas that merely
 * touch along a shared edge or corner do not overlap (SPEC-009 §5, "Two
 * areas that merely touch at an edge → Allowed"). This is the opposite
 * openness from `footprintContains`, which treats its edge as inside — that
 * is intentional, not an inconsistency: a point sitting exactly on an area's
 * boundary belongs to that area (so placing a pin there is refused), but two
 * areas sharing only a boundary are not fighting over any ground, so they
 * are allowed to sit side by side.
 */
export function footprintsOverlap(a: Footprint, b: Footprint): boolean {
  const boundsA = orderedBounds(a);
  const boundsB = orderedBounds(b);
  return (
    boundsA.minLat < boundsB.maxLat &&
    boundsA.maxLat > boundsB.minLat &&
    boundsA.minLng < boundsB.maxLng &&
    boundsA.maxLng > boundsB.minLng
  );
}

/**
 * A footprint is degenerate when either side is under 1% of the parent
 * map's corresponding extent — a mis-drag rather than an intended area. The
 * threshold is relative because parent maps vary wildly in scale.
 */
export function isDegenerateFootprint(
  footprint: Footprint,
  parentMapBounds: Footprint
): boolean {
  const { minLat, maxLat, minLng, maxLng } = orderedBounds(footprint);
  const parent = orderedBounds(parentMapBounds);

  const latThreshold = (parent.maxLat - parent.minLat) * 0.01;
  const lngThreshold = (parent.maxLng - parent.minLng) * 0.01;

  const latSpan = maxLat - minLat;
  const lngSpan = maxLng - minLng;

  return latSpan < latThreshold || lngSpan < lngThreshold;
}

/** The rectangle's midpoint — written to `lat`/`lng` at creation time. */
export function footprintCentre(footprint: Footprint): Point {
  const { minLat, maxLat, minLng, maxLng } = orderedBounds(footprint);
  return [(minLat + maxLat) / 2, (minLng + maxLng) / 2];
}

/**
 * The first sibling area a dragged footprint overlaps, or `undefined` — used
 * by `createPlace` to refuse and name the collision (SPEC-009 §7).
 */
export function findOverlappingSibling<T extends { footprint: Footprint }>(
  footprint: Footprint,
  siblings: T[]
): T | undefined {
  return siblings.find((sibling) =>
    footprintsOverlap(footprint, sibling.footprint)
  );
}

/**
 * The first sibling area containing a point, or `undefined` — used by
 * `createPlace`/`createPoi` to refuse placing a pin inside an existing area
 * (SPEC-009 §7).
 */
export function findContainingSibling<T extends { footprint: Footprint }>(
  point: Point,
  siblings: T[]
): T | undefined {
  return siblings.find((sibling) =>
    footprintContains(sibling.footprint, point)
  );
}

/**
 * Every pin a dragged footprint would cover — used by `createPlace` to
 * refuse drawing an area over existing pins and name every one of them
 * (SPEC-009 §5, §9: the app never absorbs a pin).
 */
export function findSwallowedPins<T extends { lat: number; lng: number }>(
  footprint: Footprint,
  pins: T[]
): T[] {
  return pins.filter((pin) => footprintContains(footprint, [pin.lat, pin.lng]));
}

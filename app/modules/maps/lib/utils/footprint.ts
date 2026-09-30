import polygonClipping from "polygon-clipping";
import polylabel from "polylabel";
import booleanPointInPolygon from "@turf/boolean-point-in-polygon";
import kinks from "@turf/kinks";
import { polygon as turfPolygon } from "@turf/helpers";

/**
 * Geometry for `zone.footprint` (SPEC-009, polygons since SPEC-024): the
 * outline a place casts on its parent's map. No geographic assumptions —
 * these are pixel maps whose "lat/lng" run into the hundreds, so nothing
 * here is geodesic (ADR-0019; the vendored Earth helpers stay off-limits).
 *
 * **This is the only module that knows a footprint is a polygon stored as
 * `{ ring }`**, and the only one that imports the geometry libraries
 * ADR-0019 chose. Callers ask the same questions they asked of rectangles —
 * contains, overlaps, centre — and the answers keep SPEC-009's meanings.
 *
 * Points are `[lat, lng]` throughout, handed to the libraries as-is: every
 * predicate here is planar and symmetric in its two axes, so GeoJSON's
 * `[lng, lat]` convention would change nothing but the reading (ADR-0019).
 */

export type Point = [number, number];

/** A map's extent: two opposite corners, as `mapBounds` stores them. */
export type Bounds = [Point, Point];

/**
 * One closed outline, stored open: the last vertex joins the first without
 * being repeated (SPEC-024 §6). Three vertices at least; no holes, no
 * second part (§3).
 */
export interface Footprint {
  ring: Point[];
}

const MIN_VERTICES = 3;

function isPoint(value: unknown): value is Point {
  return (
    Array.isArray(value) &&
    value.length === 2 &&
    Number.isFinite(value[0]) &&
    Number.isFinite(value[1])
  );
}

/**
 * Narrows a raw `zone.footprint` Json value read back from Prisma. Only the
 * polygon shape passes: the two-corner rectangles SPEC-009 stored were
 * converted by migration (SPEC-024 §6), so a value that is not a ring is
 * not a footprint — two accepted shapes in one Json column is how the next
 * reader gets it wrong.
 */
export function isFootprint(value: unknown): value is Footprint {
  if (typeof value !== "object" || value === null) return false;
  const ring = (value as { ring?: unknown }).ring;
  return (
    Array.isArray(ring) && ring.length >= MIN_VERTICES && ring.every(isPoint)
  );
}

/** The four corners of an axis-aligned rectangle, as a footprint. */
export function rectangleFootprint(a: Point, b: Point): Footprint {
  return {
    ring: [
      [a[0], a[1]],
      [a[0], b[1]],
      [b[0], b[1]],
      [b[0], a[1]],
    ],
  };
}

function closedRing(footprint: Footprint): Point[] {
  const [first] = footprint.ring;
  return first ? [...footprint.ring, first] : [];
}

function orderedBounds(points: Point[]) {
  const lats = points.map((point) => point[0]);
  const lngs = points.map((point) => point[1]);
  return {
    minLat: Math.min(...lats),
    maxLat: Math.max(...lats),
    minLng: Math.min(...lngs),
    maxLng: Math.max(...lngs),
  };
}

/**
 * The polygon's area, by the shoelace formula — the one piece of arithmetic
 * kept by hand (ADR-0019): no planar library offers it without a geodesic
 * assumption, and `@turf/area` answers in square metres.
 */
export function footprintArea(footprint: Footprint): number {
  const ring = footprint.ring;
  let twiceArea = 0;
  for (let i = 0; i < ring.length; i += 1) {
    const [x1, y1] = ring[i]!;
    const [x2, y2] = ring[(i + 1) % ring.length]!;
    twiceArea += x1 * y2 - x2 * y1;
  }
  return Math.abs(twiceArea) / 2;
}

/**
 * Point-in-polygon containment: a **closed** set, a point exactly on the
 * border is inside. Deliberately not the same openness as
 * `footprintsOverlap` — see the comment there for why the two differ.
 */
export function footprintContains(footprint: Footprint, point: Point): boolean {
  return booleanPointInPolygon(point, turfPolygon([closedRing(footprint)]), {
    ignoreBoundary: false,
  });
}

/**
 * Overlap tested on **open interiors**: two areas that merely touch along a
 * shared border or at a vertex do not overlap (SPEC-009 §5, "Two areas that
 * merely touch at an edge → Allowed"). This is the opposite openness from
 * `footprintContains`, which treats its border as inside — intentional, not
 * an inconsistency: a point on an area's border belongs to that area, but
 * two areas sharing only a border are not fighting over any ground.
 *
 * "Share ground" means their intersection has positive area. The tolerance
 * is relative — a billionth of the smaller polygon — so that the floating
 * point dust along a border drawn twice is not mistaken for a claim.
 */
export function footprintsOverlap(a: Footprint, b: Footprint): boolean {
  const shared = polygonClipping.intersection([closedRing(a)], [closedRing(b)]);
  const sharedArea = shared.reduce(
    (total, part) =>
      total +
      part.reduce(
        (partArea, ring, index) =>
          partArea +
          (index === 0 ? 1 : -1) * footprintArea({ ring: ring.slice(0, -1) }),
        0
      ),
    0
  );
  const tolerance = Math.min(footprintArea(a), footprintArea(b)) * 1e-9;
  return sharedArea > tolerance;
}

/**
 * Whether the outline crosses itself (SPEC-024 §5): every predicate above
 * assumes a simple polygon, so a self-intersecting one cannot be stored.
 */
export function isSelfIntersecting(footprint: Footprint): boolean {
  return kinks(turfPolygon([closedRing(footprint)])).features.length > 0;
}

/**
 * A footprint is degenerate — a mis-click, not an intended area — when its
 * bounding box is under 1% of the parent map's extent on either axis
 * (SPEC-009's rule, unchanged, so a migrated rectangle behaves exactly as it
 * did), or when its area is under 1% × 1% of the parent map's: the hairline
 * sliver a polygon can be while its bounding box looks healthy.
 */
export function isDegenerateFootprint(
  footprint: Footprint,
  parentMapBounds: Bounds
): boolean {
  const own = orderedBounds(footprint.ring);
  const parent = orderedBounds(parentMapBounds);

  const parentLatSpan = parent.maxLat - parent.minLat;
  const parentLngSpan = parent.maxLng - parent.minLng;

  return (
    own.maxLat - own.minLat < parentLatSpan * 0.01 ||
    own.maxLng - own.minLng < parentLngSpan * 0.01 ||
    footprintArea(footprint) < parentLatSpan * parentLngSpan * 0.0001
  );
}

/**
 * A point guaranteed inside the polygon — written to `lat`/`lng` at
 * creation (SPEC-024 §5). A concave outline's centroid can fall outside it,
 * so this is the pole of inaccessibility (`polylabel`, ADR-0019): the
 * interior point farthest from every edge, where a region's pin belongs.
 * For a rectangle it is the midpoint, as SPEC-009's centre was.
 */
export function footprintCentre(footprint: Footprint): Point {
  const { minLat, maxLat, minLng, maxLng } = orderedBounds(footprint.ring);
  const precision = Math.max(maxLat - minLat, maxLng - minLng) / 1000;
  const [lat, lng] = polylabel([closedRing(footprint)], precision);
  return [lat, lng];
}

/** Each vertex clamped into the map's bounds (SPEC-024 §5's edge cases). */
export function clampFootprint(
  footprint: Footprint,
  mapBounds: Bounds
): Footprint {
  const { minLat, maxLat, minLng, maxLng } = orderedBounds(mapBounds);
  return {
    ring: footprint.ring.map(([lat, lng]) => [
      Math.min(Math.max(lat, minLat), maxLat),
      Math.min(Math.max(lng, minLng), maxLng),
    ]),
  };
}

/**
 * The first sibling area a footprint overlaps, or `undefined` — used by
 * `createPlace` to refuse and name the collision (SPEC-009 §7).
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
 * Every pin a footprint would cover — used by `createPlace` to refuse
 * drawing an area over existing pins and name every one of them (SPEC-009
 * §5, §9: the app never absorbs a pin).
 */
export function findSwallowedPins<T extends { lat: number; lng: number }>(
  footprint: Footprint,
  pins: T[]
): T[] {
  return pins.filter((pin) => footprintContains(footprint, [pin.lat, pin.lng]));
}

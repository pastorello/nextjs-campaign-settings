import gridScales from "@/app/lib/config/geography/grid-scales";
import type GridScale from "@/app/lib/definitions/enums/geography/GridScale";

/**
 * SPEC-015 T3 — the conversion spine of the grid feature: pixels → squares
 * → metres. Every visible number (grid lines, legend, measurement labels)
 * comes through here.
 *
 * "Pixels" throughout means `CRS.Simple` layer coordinates, which after
 * TD-81 coincide with the image's natural pixels (`computeImageBounds`
 * frames every map as `[[0,0],[naturalHeight,naturalWidth]]`). Leaflet
 * hands click handlers these layer coordinates unchanged at every zoom —
 * zooming rescales the screen, never the layer — so everything derived
 * here is zoom-invariant by construction (SPEC-015 §5: distance is a
 * property of the map, not of the view).
 *
 * Helpers return `null` rather than a number when the grid is missing or
 * malformed: a map with no grid reports no distances at all, never a guess
 * (§5's edge-case table, the same rule TD-94 exists to enforce).
 */

/** What one square measures at this scale, from the static options. */
export function metersPerSquare(scale: GridScale): number {
  // The options array declares exactly one entry per enum member
  // (grid-scales.test.ts pins this), so the lookup cannot miss.
  const option = gridScales.find((s) => s.value === scale);
  if (!option) {
    throw new Error(`GridScale without a static option: ${scale}`);
  }
  return option.metersPerSquare;
}

/**
 * The side of one grid square in layer pixels, from the DM's chosen column
 * count and the image's natural width.
 */
export function squareSizeInPixels(
  gridColumns: number | null,
  naturalWidth: number
): number | null {
  if (!gridColumns || gridColumns <= 0 || naturalWidth <= 0) return null;
  return naturalWidth / gridColumns;
}

/**
 * The map's height in squares, derived from the image's aspect ratio once
 * the width in squares is chosen — never asked, never stored (§5). Rounded
 * to the nearest whole square: this figure is the panel's read-only sanity
 * check and the legend's total, not geometry — the overlay draws from
 * `squareSizeInPixels` instead, so rounding here distorts nothing.
 */
export function deriveGridRows(
  gridColumns: number | null,
  naturalWidth: number,
  naturalHeight: number
): number | null {
  if (!gridColumns || gridColumns <= 0) return null;
  if (naturalWidth <= 0 || naturalHeight <= 0) return null;
  return Math.round((gridColumns * naturalHeight) / naturalWidth);
}

/**
 * Distance between two layer-coordinate points, in metres — Euclidean in
 * the map's own pixel space, then squares, then the scale's metres. The
 * replacement for the haversine path TD-94 diagnosed: that formula answers
 * a question about a globe this map is not on.
 *
 * Points are `[y, x]`, Leaflet's `CRS.Simple` latitude-first convention.
 */
export function measureDistanceInMeters(
  a: [number, number],
  b: [number, number],
  gridColumns: number | null,
  naturalWidth: number,
  scale: GridScale
): number | null {
  const squareSize = squareSizeInPixels(gridColumns, naturalWidth);
  if (squareSize === null) return null;
  const pixels = Math.hypot(b[0] - a[0], b[1] - a[1]);
  return (pixels / squareSize) * metersPerSquare(scale);
}

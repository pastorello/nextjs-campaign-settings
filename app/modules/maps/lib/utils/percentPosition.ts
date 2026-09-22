/**
 * A position on a map expressed as a percentage of the map image, for the
 * coordinate fields SPEC-025 adds to the place form.
 *
 * The stored value is unchanged — `zone.lat`/`zone.lng` and `poi`'s
 * equivalents still hold the raw pair a map click produces. This module is
 * only the form's view of it, for the reason SPEC-025 §5 gives: the raw pair
 * is legible to the map and to nobody else, while "63.2% across, 41.8% down"
 * is a number a person can read, type and check. It also survives a map image
 * being re-exported at a different resolution, which the raw pair does not.
 *
 * No geographic assumptions: like `footprint.ts`, these bounds come from
 * uploaded images and can exceed lat ±90 / lng ±180. `across` runs left to
 * right with longitude; `down` runs top to bottom, so it counts *against*
 * latitude — the top edge of the image is the larger latitude.
 */

export type MapCorners = [[number, number], [number, number]];

/** Both percentages of one position. 0–100 each, before rounding. */
export interface PercentPosition {
  across: number;
  down: number;
}

/** How many decimals a percentage keeps — see `formatPercent`. */
const DECIMALS = 1;

function orderedCorners(corners: MapCorners) {
  const [[lat1, lng1], [lat2, lng2]] = corners;
  return {
    minLat: Math.min(lat1, lat2),
    maxLat: Math.max(lat1, lat2),
    minLng: Math.min(lng1, lng2),
    maxLng: Math.max(lng1, lng2),
  };
}

/**
 * Whether a percentage pair can be converted at all. A map whose corners
 * collapse in either axis — the degenerate bounds an image that failed to
 * load leaves behind — would divide by zero, and the caller shows the
 * disabled state instead (SPEC-025 §5, "the map has no image yet").
 */
export function hasUsableCorners(corners: MapCorners | null): boolean {
  if (!corners) return false;
  const { minLat, maxLat, minLng, maxLng } = orderedCorners(corners);
  return maxLat > minLat && maxLng > minLng;
}

export function toPercentPosition(
  lat: number,
  lng: number,
  corners: MapCorners
): PercentPosition {
  const { minLat, maxLat, minLng, maxLng } = orderedCorners(corners);
  return {
    across: ((lng - minLng) / (maxLng - minLng)) * 100,
    down: ((maxLat - lat) / (maxLat - minLat)) * 100,
  };
}

export function fromPercentPosition(
  position: PercentPosition,
  corners: MapCorners
): { lat: number; lng: number } {
  const { minLat, maxLat, minLng, maxLng } = orderedCorners(corners);
  return {
    lat: maxLat - (position.down / 100) * (maxLat - minLat),
    lng: minLng + (position.across / 100) * (maxLng - minLng),
  };
}

/**
 * One decimal place, and no trailing `.0`. A tenth of a percent is finer
 * than a pin can be clicked on any map this app displays, so rounding here
 * loses nothing a person could have aimed at — and it keeps the field from
 * showing the seventeen digits a round trip through the raw pair produces.
 */
export function formatPercent(value: number): string {
  return String(Number(value.toFixed(DECIMALS)));
}

/**
 * Reads what was typed. `null` means "not a usable number" — empty, blank,
 * not numeric, or outside the image — and the caller turns that into the
 * field-level message rather than guessing a position. A comma is accepted
 * as the decimal separator: the UI ships in Italian, where that is what the
 * keyboard produces.
 */
export function parsePercentInput(raw: string): number | null {
  const trimmed = raw.trim().replace(",", ".");
  if (trimmed === "") return null;
  const value = Number(trimmed);
  if (!Number.isFinite(value)) return null;
  if (value < 0 || value > 100) return null;
  return value;
}

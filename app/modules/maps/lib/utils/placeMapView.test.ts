import { describe, expect, it } from "vitest";

import {
  DEFAULT_MAP_BOUNDS,
  DEFAULT_MAP_INITIAL_VIEW,
  DEFAULT_MAP_INITIAL_ZOOM,
  computeImageBounds,
  computeMinZoom,
  parsePlaceMapBounds,
  parsePlaceMapInitialView,
  parsePlaceMapInitialZoom,
} from "./placeMapView";

describe("placeMapView", () => {
  it("parses a well-formed bounds value", () => {
    const bounds = [
      [0, 0],
      [500, 800],
    ];

    expect(parsePlaceMapBounds(bounds)).toEqual(bounds);
  });

  it("falls back to the default bounds for null", () => {
    expect(parsePlaceMapBounds(null)).toEqual(DEFAULT_MAP_BOUNDS);
  });

  it("falls back to the default bounds for a malformed value", () => {
    expect(parsePlaceMapBounds({ not: "bounds" })).toEqual(DEFAULT_MAP_BOUNDS);
  });

  it("parses a well-formed initial view", () => {
    expect(parsePlaceMapInitialView([12, 34])).toEqual([12, 34]);
  });

  it("falls back to the default initial view for null", () => {
    expect(parsePlaceMapInitialView(null)).toEqual(DEFAULT_MAP_INITIAL_VIEW);
  });

  it("returns a stored zoom", () => {
    expect(parsePlaceMapInitialZoom(3)).toBe(3);
  });

  it("falls back to the default zoom for null", () => {
    expect(parsePlaceMapInitialZoom(null)).toBe(DEFAULT_MAP_INITIAL_ZOOM);
  });
});

// TD-81: every map used to be framed against `DEFAULT_MAP_BOUNDS`, a
// hardcoded square, so `L.imageOverlay` stretched any non-square image to
// fill it. These bounds are derived from the image's own natural pixel
// size instead, so the overlay's aspect ratio always matches the file's.
describe("computeImageBounds", () => {
  it("preserves a square image's 1:1 ratio", () => {
    expect(computeImageBounds(1000, 1000)).toEqual([
      [0, 0],
      [1000, 1000],
    ]);
  });

  it("preserves a wide (landscape) image's aspect ratio rather than a square default", () => {
    const bounds = computeImageBounds(1600, 900);

    expect(bounds).toEqual([
      [0, 0],
      [900, 1600],
    ]);
    // height:width of the resulting box must equal the source image's
    // height:width — this is the assertion that fails against
    // `DEFAULT_MAP_BOUNDS` for any non-square image (its ratio is always
    // 1:1 regardless of what the real image looks like).
    const [, [boundsHeight, boundsWidth]] = bounds as [
      [number, number],
      [number, number],
    ];
    expect(boundsHeight / boundsWidth).toBeCloseTo(900 / 1600);
  });

  it("preserves a tall (portrait) image's aspect ratio", () => {
    const bounds = computeImageBounds(900, 1600);

    expect(bounds).toEqual([
      [0, 0],
      [1600, 900],
    ]);
    const [, [boundsHeight, boundsWidth]] = bounds as [
      [number, number],
      [number, number],
    ];
    expect(boundsHeight / boundsWidth).toBeCloseTo(1600 / 900);
  });
});

// TD-87: every map used to open with `setMinZoom(0)` and a view then
// clamped up to that same `0` — pinned exactly at its own floor, so "zoom
// out" had nothing to do. `computeMinZoom` is the arithmetic at the heart
// of the fix: the floor must sit strictly below wherever the map is about
// to open, and never above the zoom at which the whole image fits.
describe("computeMinZoom", () => {
  it("leaves headroom below the opening zoom when the image's own fit is looser than that", () => {
    // A large image needing to zoom out to -4 to fit its container — well
    // past the opening zoom of -2 (`DEFAULT_MAP_INITIAL_ZOOM`, what every
    // real place opens at today, since nothing writes `mapInitialZoom`).
    const minZoom = computeMinZoom(-4, -2);

    expect(minZoom).toBeLessThan(-2);
    expect(minZoom).toBeLessThanOrEqual(-4);
  });

  it("never raises the floor above where the whole image is visible, even for a tight opening zoom", () => {
    // The opening zoom asks for very little headroom (one step below the
    // fit); the floor must still not end up above the fit zoom itself.
    const fitZoom = -4;
    const minZoom = computeMinZoom(fitZoom, fitZoom - 1);

    expect(minZoom).toBeLessThanOrEqual(fitZoom);
  });

  it("always leaves at least one full zoom step of headroom below the opening zoom", () => {
    // Reproduces TD-87's exact original bug shape: the image's own fit (0,
    // matching the old hardcoded floor) is *not* looser than the opening
    // zoom, so naively taking the fit alone would reproduce "floor equals
    // opening zoom, zoom out does nothing."
    const minZoom = computeMinZoom(0, 0);

    expect(minZoom).toBeLessThan(0);
  });
});

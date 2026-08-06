import { describe, expect, it } from "vitest";

import {
  DEFAULT_MAP_BOUNDS,
  DEFAULT_MAP_INITIAL_VIEW,
  DEFAULT_MAP_INITIAL_ZOOM,
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

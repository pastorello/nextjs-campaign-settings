import { describe, expect, it } from "vitest";
import * as L from "leaflet";
import type { Map as LeafletMap, Marker, TileLayer } from "leaflet";

import {
  calculateBounds,
  calculateBoundsArea,
  calculateRawBounds,
  expandBounds,
  getBoundsCenter,
  isCoordinateInBounds,
  safeAddLayer,
  safeFitBounds,
  safeFlyTo,
  safeGetBounds,
  safeGetCenter,
  safeGetMarkerPosition,
  safeGetZoom,
  safeHasLayer,
  safeInvalidateSize,
  safeRemoveLayer,
  safeSetMarkerPosition,
  safeSetView,
  safeZoomIn,
  safeZoomOut,
} from "./maps";

describe("calculateRawBounds", () => {
  it("returns null for an empty array", () => {
    expect(calculateRawBounds([])).toBeNull();
  });

  it("pads a single coordinate by a fixed offset", () => {
    const result = calculateRawBounds([[10, 20]]);
    expect(result).toEqual({
      minLat: 10 - 0.001,
      maxLat: 10 + 0.001,
      minLng: 20 - 0.001,
      maxLng: 20 + 0.001,
    });
  });

  it("finds the enclosing box for several coordinates", () => {
    const result = calculateRawBounds([
      [0, 0],
      [10, -5],
      [-3, 8],
    ]);
    expect(result).toEqual({ minLat: -3, maxLat: 10, minLng: -5, maxLng: 8 });
  });
});

describe("calculateBounds", () => {
  it("returns null for an empty array", async () => {
    expect(await calculateBounds([])).toBeNull();
  });

  it("returns a LatLngBounds matching the raw bounds", async () => {
    const bounds = await calculateBounds([
      [0, 0],
      [10, 10],
    ]);
    expect(bounds?.getSouthWest().lat).toBe(0);
    expect(bounds?.getNorthEast().lat).toBe(10);
  });
});

describe("expandBounds", () => {
  it("grows the bounds by the given percentage on every side", async () => {
    const original = L.latLngBounds([0, 0], [10, 10]);
    const expanded = await expandBounds(original, 0.1);

    expect(expanded.getSouthWest().lat).toBeCloseTo(-1, 5);
    expect(expanded.getNorthEast().lat).toBeCloseTo(11, 5);
  });
});

describe("isCoordinateInBounds", () => {
  it("reports containment via the bounds object", () => {
    const bounds = L.latLngBounds([0, 0], [10, 10]);
    expect(isCoordinateInBounds([5, 5], bounds)).toBe(true);
    expect(isCoordinateInBounds([50, 50], bounds)).toBe(false);
  });
});

describe("getBoundsCenter", () => {
  it("returns the midpoint of the bounds", () => {
    const bounds = L.latLngBounds([0, 0], [10, 10]);
    const [lat, lng] = getBoundsCenter(bounds);
    expect(lat).toBeCloseTo(5, 5);
    expect(lng).toBeCloseTo(5, 5);
  });
});

describe("calculateBoundsArea", () => {
  it("returns a positive area for a non-degenerate box", async () => {
    const bounds = L.latLngBounds([0, 0], [1, 1]);
    expect(await calculateBoundsArea(bounds)).toBeGreaterThan(0);
  });

  it("returns 0 for a degenerate (zero-size) box", async () => {
    const bounds = L.latLngBounds([0, 0], [0, 0]);
    expect(await calculateBoundsArea(bounds)).toBe(0);
  });
});

describe("safe* map operations", () => {
  it("safeGetZoom falls back to the default when the map is missing", () => {
    expect(safeGetZoom(null, 7)).toBe(7);
  });

  it("safeGetZoom reads the map's zoom when present", () => {
    const map = { getZoom: () => 12 } as unknown as LeafletMap;
    expect(safeGetZoom(map)).toBe(12);
  });

  it("safeGetZoom falls back to the default if the map throws", () => {
    const map = {
      getZoom: () => {
        throw new Error("not ready");
      },
    } as unknown as LeafletMap;
    expect(safeGetZoom(map, 9)).toBe(9);
  });

  it("safeGetCenter falls back to the default when the map is missing", () => {
    expect(safeGetCenter(undefined, [1, 2])).toEqual([1, 2]);
  });

  it("safeGetCenter reads the map's center when present", () => {
    const map = {
      getCenter: () => ({ lat: 5, lng: 6 }),
    } as unknown as LeafletMap;
    expect(safeGetCenter(map)).toEqual([5, 6]);
  });

  it("safeGetBounds returns null when the map is missing", () => {
    expect(safeGetBounds(null)).toBeNull();
  });

  it("safeGetBounds returns null instead of throwing", () => {
    const map = {
      getBounds: () => {
        throw new Error("not ready");
      },
    } as unknown as LeafletMap;
    expect(safeGetBounds(map)).toBeNull();
  });

  it("safeSetView returns false when the map is missing", () => {
    expect(safeSetView(null, [0, 0], 5)).toBe(false);
  });

  it("safeSetView calls setView and returns true on success", () => {
    let called: unknown;
    const map = {
      setView: (center: unknown) => {
        called = center;
      },
    } as unknown as LeafletMap;

    expect(safeSetView(map, [1, 2], 5)).toBe(true);
    expect(called).toEqual([1, 2]);
  });

  it("safeFlyTo returns false rather than throwing on failure", () => {
    const map = {
      flyTo: () => {
        throw new Error("boom");
      },
    } as unknown as LeafletMap;
    expect(safeFlyTo(map, [0, 0], 5)).toBe(false);
  });

  it("safeZoomIn/safeZoomOut return false when the map is missing", () => {
    expect(safeZoomIn(null)).toBe(false);
    expect(safeZoomOut(null)).toBe(false);
  });

  it("safeZoomIn/safeZoomOut return true on success", () => {
    const map = {
      zoomIn: () => {},
      zoomOut: () => {},
    } as unknown as LeafletMap;
    expect(safeZoomIn(map)).toBe(true);
    expect(safeZoomOut(map)).toBe(true);
  });

  it("safeGetMarkerPosition falls back to the default when the marker is missing", () => {
    expect(safeGetMarkerPosition(null, [9, 9])).toEqual([9, 9]);
  });

  it("safeGetMarkerPosition reads the marker's position when present", () => {
    const marker = {
      getLatLng: () => ({ lat: 3, lng: 4 }),
    } as unknown as Marker;
    expect(safeGetMarkerPosition(marker)).toEqual([3, 4]);
  });

  it("safeSetMarkerPosition returns false when the marker is missing", () => {
    expect(safeSetMarkerPosition(null, [0, 0])).toBe(false);
  });

  it("safeSetMarkerPosition calls setLatLng and returns true on success", () => {
    let called: unknown;
    const marker = {
      setLatLng: (pos: unknown) => {
        called = pos;
      },
    } as unknown as Marker;

    expect(safeSetMarkerPosition(marker, [1, 1])).toBe(true);
    expect(called).toEqual([1, 1]);
  });

  it("safeRemoveLayer/safeAddLayer/safeHasLayer return false without a map or layer", () => {
    expect(safeRemoveLayer(null, null)).toBe(false);
    expect(safeAddLayer(null, null)).toBe(false);
    expect(safeHasLayer(null, null)).toBe(false);
  });

  it("safeRemoveLayer/safeAddLayer/safeHasLayer delegate to the map on success", () => {
    const layer = {} as unknown as TileLayer;
    const map = {
      removeLayer: () => {},
      addLayer: () => {},
      hasLayer: () => true,
    } as unknown as LeafletMap;

    expect(safeRemoveLayer(map, layer)).toBe(true);
    expect(safeAddLayer(map, layer)).toBe(true);
    expect(safeHasLayer(map, layer)).toBe(true);
  });

  it("safeInvalidateSize returns false when the map is missing", () => {
    expect(safeInvalidateSize(null)).toBe(false);
  });

  it("safeInvalidateSize returns true on success", () => {
    const map = { invalidateSize: () => {} } as unknown as LeafletMap;
    expect(safeInvalidateSize(map)).toBe(true);
  });

  it("safeFitBounds returns false without a map or bounds", () => {
    expect(safeFitBounds(null, null)).toBe(false);
    expect(safeFitBounds({} as unknown as LeafletMap, null)).toBe(false);
  });

  it("safeFitBounds returns true on success", () => {
    const map = { fitBounds: () => {} } as unknown as LeafletMap;
    const bounds = L.latLngBounds([0, 0], [1, 1]);
    expect(safeFitBounds(map, bounds)).toBe(true);
  });
});

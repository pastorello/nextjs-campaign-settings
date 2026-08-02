import { describe, expect, it } from "vitest";
import type { LatLngBounds } from "leaflet";

import {
  clampZoom,
  isValidBounds,
  isValidCoordinate,
  isValidLeafletBounds,
  isValidMarkerPosition,
  isValidTileUrl,
  isValidZoom,
  validateMapConfig,
} from "./validation";

describe("isValidZoom", () => {
  it.each([
    [10, true],
    [0, true],
    [18, true],
    [-1, false],
    [19, false],
    [NaN, false],
  ])("%s -> %s", (zoom, expected) => {
    expect(isValidZoom(zoom)).toBe(expected);
  });

  it("honours custom min/max bounds", () => {
    expect(isValidZoom(5, 6, 10)).toBe(false);
    expect(isValidZoom(7, 6, 10)).toBe(true);
  });
});

describe("isValidBounds", () => {
  it("accepts properly ordered, in-range bounds", () => {
    expect(
      isValidBounds([
        [-10, -10],
        [10, 10],
      ])
    ).toBe(true);
  });

  it("rejects a minLat greater than maxLat", () => {
    expect(
      isValidBounds([
        [10, -10],
        [-10, 10],
      ])
    ).toBe(false);
  });

  it("rejects an out-of-range latitude", () => {
    expect(
      isValidBounds([
        [-95, -10],
        [10, 10],
      ])
    ).toBe(false);
  });

  it("does not reject minLng > maxLng — bounds may cross the antimeridian", () => {
    expect(
      isValidBounds([
        [-10, 170],
        [10, -170],
      ])
    ).toBe(true);
  });

  it("rejects a NaN value", () => {
    expect(
      isValidBounds([
        [NaN, -10],
        [10, 10],
      ])
    ).toBe(false);
  });
});

describe("isValidCoordinate", () => {
  it.each([
    [[0, 0], true],
    [[91, 0], false],
    [[0, 181], false],
    [[NaN, 0], false],
  ] as const)("%j -> %s", (coord, expected) => {
    expect(isValidCoordinate([...coord] as [number, number])).toBe(expected);
  });
});

describe("validateMapConfig", () => {
  it("is valid for an empty (all fields unset) config", () => {
    expect(validateMapConfig({})).toEqual({ isValid: true, errors: [] });
  });

  it("flags an out-of-range center", () => {
    const result = validateMapConfig({ defaultCenter: [999, 0] });
    expect(result.isValid).toBe(false);
    expect(result.errors).toContain("Invalid center coordinates");
  });

  it("flags a default zoom outside 0-20", () => {
    const result = validateMapConfig({ defaultZoom: 25 });
    expect(result.errors).toContain("Default zoom must be between 0 and 20");
  });

  it("flags minZoom greater than maxZoom", () => {
    const result = validateMapConfig({ minZoom: 10, maxZoom: 5 });
    expect(result.errors).toContain(
      "Min zoom must be less than or equal to max zoom"
    );
  });

  it("flags a default zoom below minZoom", () => {
    const result = validateMapConfig({ defaultZoom: 1, minZoom: 5 });
    expect(result.errors).toContain("Default zoom must be >= min zoom");
  });

  it("flags a default zoom above maxZoom", () => {
    const result = validateMapConfig({ defaultZoom: 15, maxZoom: 10 });
    expect(result.errors).toContain("Default zoom must be <= max zoom");
  });

  it("is valid for a fully consistent config", () => {
    const result = validateMapConfig({
      defaultCenter: [51.5, -0.09],
      defaultZoom: 10,
      minZoom: 0,
      maxZoom: 18,
    });
    expect(result).toEqual({ isValid: true, errors: [] });
  });
});

describe("isValidTileUrl", () => {
  it("accepts a URL with all three placeholders", () => {
    expect(isValidTileUrl("https://tile.example/{z}/{x}/{y}.png")).toBe(true);
  });

  it("rejects an empty string", () => {
    expect(isValidTileUrl("")).toBe(false);
  });

  it("rejects a URL missing a placeholder", () => {
    expect(isValidTileUrl("https://tile.example/{x}/{y}.png")).toBe(false);
  });
});

describe("isValidMarkerPosition", () => {
  it("delegates to the same rules as isValidCoordinate", () => {
    expect(isValidMarkerPosition([51.5, -0.09])).toBe(true);
    expect(isValidMarkerPosition([999, 0])).toBe(false);
  });
});

describe("clampZoom", () => {
  it.each([
    [25, 18],
    [-5, 0],
    [10, 10],
  ])("%d -> %d", (input, expected) => {
    expect(clampZoom(input)).toBe(expected);
  });

  it("honours custom min/max", () => {
    expect(clampZoom(3, 5, 10)).toBe(5);
  });
});

describe("isValidLeafletBounds", () => {
  function fakeBounds(sw: [number, number], ne: [number, number]) {
    return {
      getSouthWest: () => ({ lat: sw[0], lng: sw[1] }),
      getNorthEast: () => ({ lat: ne[0], lng: ne[1] }),
    } as unknown as LatLngBounds;
  }

  it("returns false for null/undefined", () => {
    expect(isValidLeafletBounds(null)).toBe(false);
    expect(isValidLeafletBounds(undefined)).toBe(false);
  });

  it("returns true for a well-ordered, in-range bounds object", () => {
    expect(isValidLeafletBounds(fakeBounds([-10, -10], [10, 10]))).toBe(true);
  });

  it("returns false when the southwest corner is north of the northeast corner", () => {
    expect(isValidLeafletBounds(fakeBounds([10, -10], [-10, 10]))).toBe(false);
  });

  it("returns false rather than throwing when the bounds object misbehaves", () => {
    const broken = {
      getSouthWest: () => {
        throw new Error("boom");
      },
      getNorthEast: () => ({ lat: 0, lng: 0 }),
    } as unknown as LatLngBounds;

    expect(isValidLeafletBounds(broken)).toBe(false);
  });
});

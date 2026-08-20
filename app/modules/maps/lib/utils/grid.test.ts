import { describe, expect, it } from "vitest";

import GridScale from "@/app/lib/definitions/enums/geography/GridScale";
import gridScales from "@/app/lib/config/geography/grid-scales";
import {
  deriveGridRows,
  measureDistanceInMeters,
  metersPerSquare,
  squareSizeInPixels,
} from "./grid";

describe("metersPerSquare", () => {
  it.each(gridScales.map((s) => [s.value, s.metersPerSquare] as const))(
    "resolves %s from the static options",
    (scale, meters) => {
      expect(metersPerSquare(scale)).toBe(meters);
    }
  );
});

describe("deriveGridRows", () => {
  it("derives the height in squares from the image's aspect ratio", () => {
    // 36 squares across a 3:2 image → 24 down (SPEC-015 §5's own example).
    expect(deriveGridRows(36, 1500, 1000)).toBe(24);
  });

  it("rounds to the nearest whole square for display", () => {
    // 1333/1000 × 36 = 47.988 — the figure is a read-only sanity check,
    // not geometry (the overlay draws from squareSizeInPixels instead).
    expect(deriveGridRows(36, 1000, 1333)).toBe(48);
  });

  it("returns null when any input is missing or non-positive", () => {
    expect(deriveGridRows(0, 1500, 1000)).toBeNull();
    expect(deriveGridRows(-5, 1500, 1000)).toBeNull();
    expect(deriveGridRows(36, 0, 1000)).toBeNull();
    expect(deriveGridRows(36, 1500, 0)).toBeNull();
    expect(deriveGridRows(null, 1500, 1000)).toBeNull();
  });
});

describe("squareSizeInPixels", () => {
  it("is the image width divided by the column count", () => {
    expect(squareSizeInPixels(36, 1800)).toBe(50);
  });

  it("returns null for a zero or negative column count", () => {
    expect(squareSizeInPixels(0, 1800)).toBeNull();
    expect(squareSizeInPixels(-1, 1800)).toBeNull();
  });
});

describe("measureDistanceInMeters", () => {
  // Points are CRS.Simple layer coordinates, [y, x] — the same pairs
  // Leaflet hands every click handler, which never change with zoom.

  it.each(gridScales.map((s) => [s.value, s.metersPerSquare] as const))(
    "a segment spanning exactly three squares is 3 × %s's square",
    (scale, meters) => {
      // 36 columns over 1800px → 50px per square; 150px along x = 3 squares.
      expect(
        measureDistanceInMeters([0, 0], [0, 150], 36, 1800, scale)
      ).toBeCloseTo(3 * meters, 6);
    }
  );

  it("measures diagonals euclideanly, not along the grid", () => {
    // A 3-4-5 triangle in squares: 150px and 200px legs → 250px = 5 squares.
    expect(
      measureDistanceInMeters([0, 0], [200, 150], 36, 1800, GridScale.Kingdom)
    ).toBeCloseTo(5 * 9_000, 6);
  });

  it("depends only on the points' separation, not their absolute position", () => {
    const atOrigin = measureDistanceInMeters(
      [0, 0],
      [30, 40],
      36,
      1800,
      GridScale.Dungeon
    );
    const translated = measureDistanceInMeters(
      [700, 900],
      [730, 940],
      36,
      1800,
      GridScale.Dungeon
    );
    // `?? NaN` narrows the nullable return; a null would fail the match.
    expect(translated).toBeCloseTo(atOrigin ?? Number.NaN, 9);
  });

  it("is zoom-invariant: layer coordinates do not scale with the view", () => {
    // Zooming multiplies SCREEN pixels by 2^z but leaves layer coordinates
    // untouched — the function takes only layer coordinates and the image's
    // natural size, so there is no zoom input to vary. What must hold is
    // the ratio: the same points against the same image give the same
    // answer, and scaling points and image together (a genuinely larger
    // image, not a zoom) preserves the squares spanned.
    const base = measureDistanceInMeters(
      [0, 0],
      [0, 300],
      36,
      1800,
      GridScale.Kingdom
    );
    const doubledImage = measureDistanceInMeters(
      [0, 0],
      [0, 600],
      36,
      3600,
      GridScale.Kingdom
    );
    expect(doubledImage).toBeCloseTo(base ?? Number.NaN, 9);
  });

  it("returns null when the grid is not configured", () => {
    expect(
      measureDistanceInMeters([0, 0], [0, 150], null, 1800, GridScale.Kingdom)
    ).toBeNull();
    expect(
      measureDistanceInMeters([0, 0], [0, 150], 0, 1800, GridScale.Kingdom)
    ).toBeNull();
  });
});

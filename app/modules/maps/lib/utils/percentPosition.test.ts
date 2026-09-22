import { describe, expect, it } from "vitest";

import {
  formatPercent,
  fromPercentPosition,
  hasUsableCorners,
  parsePercentInput,
  toPercentPosition,
  type MapCorners,
} from "./percentPosition";

// A 1000×500 image in the pixel space the map uses: the south-west corner
// first, as Leaflet's bounds arrays are written.
const corners: MapCorners = [
  [0, 0],
  [500, 1000],
];

describe("toPercentPosition", () => {
  it("reads the top-left corner as 0% across, 0% down", () => {
    expect(toPercentPosition(500, 0, corners)).toEqual({ across: 0, down: 0 });
  });

  it("reads the bottom-right corner as 100% across, 100% down", () => {
    expect(toPercentPosition(0, 1000, corners)).toEqual({
      across: 100,
      down: 100,
    });
  });

  it("counts `down` against latitude, so the top edge is the larger one", () => {
    expect(toPercentPosition(375, 250, corners)).toEqual({
      across: 25,
      down: 25,
    });
  });

  it("does not care which corner is written first", () => {
    const reversed: MapCorners = [
      [500, 1000],
      [0, 0],
    ];

    expect(toPercentPosition(375, 250, reversed)).toEqual(
      toPercentPosition(375, 250, corners)
    );
  });
});

describe("fromPercentPosition", () => {
  it("is the inverse of toPercentPosition", () => {
    const point = { lat: 137.5, lng: 862.5 };
    const percent = toPercentPosition(point.lat, point.lng, corners);

    expect(fromPercentPosition(percent, corners)).toEqual(point);
  });

  it("puts 0% down at the top edge, not the bottom", () => {
    expect(fromPercentPosition({ across: 50, down: 0 }, corners)).toEqual({
      lat: 500,
      lng: 500,
    });
  });
});

describe("hasUsableCorners", () => {
  it("rejects corners that collapse in one axis", () => {
    expect(
      hasUsableCorners([
        [0, 0],
        [0, 1000],
      ])
    ).toBe(false);
  });

  it("rejects a missing set of corners", () => {
    expect(hasUsableCorners(null)).toBe(false);
  });

  it("accepts a real image's corners", () => {
    expect(hasUsableCorners(corners)).toBe(true);
  });
});

describe("formatPercent", () => {
  it("keeps one decimal", () => {
    expect(formatPercent(63.2489)).toBe("63.2");
  });

  it("drops a trailing zero rather than writing 50.0", () => {
    expect(formatPercent(50)).toBe("50");
  });
});

describe("parsePercentInput", () => {
  it.each([
    ["63.2", 63.2],
    ["63,2", 63.2],
    [" 0 ", 0],
    ["100", 100],
  ])("reads %j as %j", (raw, expected) => {
    expect(parsePercentInput(raw)).toBe(expected);
  });

  it.each(["", "   ", "abc", "-1", "101", "NaN", "Infinity"])(
    "refuses %j",
    (raw) => {
      expect(parsePercentInput(raw)).toBeNull();
    }
  );
});

import { describe, expect, it } from "vitest";

import {
  calculateDistance,
  clampLatitude,
  decimalToDMS,
  formatCoordinate,
  formatDecimalDegrees,
  formatDMS,
  isValidCoordinate,
  normalizeCoordinate,
  normalizeLongitude,
  parseCoordinate,
} from "./coordinates";

describe("isValidCoordinate", () => {
  it.each([
    [[0, 0], true],
    [[90, 180], true],
    [[-90, -180], true],
    [[90.1, 0], false],
    [[-90.1, 0], false],
    [[0, 180.1], false],
    [[0, -180.1], false],
  ] as const)("%j -> %s", (coord, expected) => {
    expect(isValidCoordinate([...coord] as [number, number])).toBe(expected);
  });
});

describe("formatCoordinate", () => {
  it("formats a northeast coordinate with N/E suffixes", () => {
    expect(formatCoordinate([51.505, 0.09])).toBe("51.505000°N, 0.090000°E");
  });

  it("formats a southwest coordinate with S/W suffixes", () => {
    expect(formatCoordinate([-51.505, -0.09])).toBe("51.505000°S, 0.090000°W");
  });

  it("honours a custom precision", () => {
    expect(formatCoordinate([51.5, -0.1], 2)).toBe("51.50°N, 0.10°W");
  });
});

describe("parseCoordinate", () => {
  it("round-trips a value produced by formatCoordinate", () => {
    const original: [number, number] = [51.505, -0.09];
    expect(parseCoordinate(formatCoordinate(original))).toEqual(original);
  });

  it("returns null for a string that doesn't match the format", () => {
    expect(parseCoordinate("not a coordinate")).toBeNull();
  });

  it("returns null when the parsed coordinate is out of range", () => {
    expect(parseCoordinate("95.000000°N, 0.000000°E")).toBeNull();
  });
});

describe("formatDecimalDegrees", () => {
  it("formats both values to the given precision", () => {
    expect(formatDecimalDegrees([51.505, -0.09], 3)).toBe("51.505, -0.090");
  });
});

describe("decimalToDMS", () => {
  it("splits a decimal degree into degrees, minutes and seconds", () => {
    const result = decimalToDMS(51.5);
    expect(result.degrees).toBe(51);
    expect(result.minutes).toBe(30);
    expect(result.seconds).toBeCloseTo(0, 5);
  });

  it("takes the absolute value first, so a negative input still yields positive parts", () => {
    const result = decimalToDMS(-51.5);
    expect(result.degrees).toBe(51);
    expect(result.minutes).toBe(30);
  });
});

describe("formatDMS", () => {
  it("formats a coordinate with degree/minute/second markers", () => {
    expect(formatDMS([51, 0])).toBe(`51°0'0.00"N, 0°0'0.00"E`);
  });
});

describe("normalizeLongitude", () => {
  it.each([
    [190, -170],
    [-190, 170],
    [180, 180],
    [-180, -180],
    [45, 45],
  ])("%d -> %d", (input, expected) => {
    expect(normalizeLongitude(input)).toBeCloseTo(expected, 10);
  });
});

describe("clampLatitude", () => {
  it.each([
    [95, 90],
    [-95, -90],
    [45, 45],
  ])("%d -> %d", (input, expected) => {
    expect(clampLatitude(input)).toBe(expected);
  });
});

describe("normalizeCoordinate", () => {
  it("clamps latitude and normalizes longitude together", () => {
    expect(normalizeCoordinate([95, 190])).toEqual([90, -170]);
  });
});

describe("calculateDistance", () => {
  it("returns 0 for identical coordinates", () => {
    expect(calculateDistance([51.5, -0.09], [51.5, -0.09])).toBe(0);
  });

  it("returns a plausible distance for two known points", () => {
    // London (51.5074, -0.1278) to Paris (48.8566, 2.3522): ~344 km.
    const distance = calculateDistance([51.5074, -0.1278], [48.8566, 2.3522]);
    expect(distance).toBeGreaterThan(340_000);
    expect(distance).toBeLessThan(350_000);
  });
});

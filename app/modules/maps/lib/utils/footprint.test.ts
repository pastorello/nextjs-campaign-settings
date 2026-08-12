import { describe, expect, it } from "vitest";

import {
  footprintCentre,
  footprintContains,
  footprintsOverlap,
  isDegenerateFootprint,
} from "./footprint";

const footprint: [[number, number], [number, number]] = [
  [0, 0],
  [10, 20],
];

describe("footprintContains", () => {
  it("contains a point strictly inside", () => {
    expect(footprintContains(footprint, [5, 10])).toBe(true);
  });

  it("excludes a point strictly outside", () => {
    expect(footprintContains(footprint, [15, 10])).toBe(false);
    expect(footprintContains(footprint, [5, 25])).toBe(false);
  });

  it("includes a point exactly on the edge (closed set)", () => {
    expect(footprintContains(footprint, [0, 10])).toBe(true);
    expect(footprintContains(footprint, [10, 10])).toBe(true);
    expect(footprintContains(footprint, [5, 0])).toBe(true);
    expect(footprintContains(footprint, [5, 20])).toBe(true);
  });

  it("includes a point exactly on a corner", () => {
    expect(footprintContains(footprint, [0, 0])).toBe(true);
    expect(footprintContains(footprint, [10, 20])).toBe(true);
  });
});

describe("footprintsOverlap", () => {
  it("detects a partial overlap", () => {
    const other: [[number, number], [number, number]] = [
      [5, 15],
      [15, 25],
    ];
    expect(footprintsOverlap(footprint, other)).toBe(true);
  });

  it("detects one rectangle entirely inside another", () => {
    const inner: [[number, number], [number, number]] = [
      [2, 2],
      [8, 8],
    ];
    expect(footprintsOverlap(footprint, inner)).toBe(true);
    expect(footprintsOverlap(inner, footprint)).toBe(true);
  });

  it("does not consider rectangles that only touch on an edge as overlapping", () => {
    const rightNeighbour: [[number, number], [number, number]] = [
      [0, 20],
      [10, 30],
    ];
    expect(footprintsOverlap(footprint, rightNeighbour)).toBe(false);
  });

  it("does not consider rectangles that only touch at a corner as overlapping", () => {
    const cornerNeighbour: [[number, number], [number, number]] = [
      [10, 20],
      [20, 30],
    ];
    expect(footprintsOverlap(footprint, cornerNeighbour)).toBe(false);
  });

  it("does not consider disjoint rectangles as overlapping", () => {
    const far: [[number, number], [number, number]] = [
      [100, 100],
      [110, 110],
    ];
    expect(footprintsOverlap(footprint, far)).toBe(false);
  });
});

describe("isDegenerateFootprint", () => {
  const parentMapBounds: [[number, number], [number, number]] = [
    [0, 0],
    [100, 100],
  ];

  it("flags a rectangle below the 1% threshold on one side", () => {
    const thin: [[number, number], [number, number]] = [
      [0, 0],
      [0.5, 50],
    ];
    expect(isDegenerateFootprint(thin, parentMapBounds)).toBe(true);
  });

  it("flags a rectangle below the threshold on both sides", () => {
    const tiny: [[number, number], [number, number]] = [
      [0, 0],
      [0.5, 0.5],
    ];
    expect(isDegenerateFootprint(tiny, parentMapBounds)).toBe(true);
  });

  it("does not flag a rectangle exactly at the threshold", () => {
    const atThreshold: [[number, number], [number, number]] = [
      [0, 0],
      [1, 1],
    ];
    expect(isDegenerateFootprint(atThreshold, parentMapBounds)).toBe(false);
  });

  it("does not flag a comfortably sized rectangle", () => {
    const roomy: [[number, number], [number, number]] = [
      [10, 10],
      [50, 50],
    ];
    expect(isDegenerateFootprint(roomy, parentMapBounds)).toBe(false);
  });
});

describe("footprintCentre", () => {
  it("returns the midpoint of a rectangle", () => {
    expect(footprintCentre(footprint)).toEqual([5, 10]);
  });

  it("returns the midpoint of a non-square rectangle", () => {
    const rect: [[number, number], [number, number]] = [
      [-10, 0],
      [10, 100],
    ];
    expect(footprintCentre(rect)).toEqual([0, 50]);
  });
});

import { describe, expect, it } from "vitest";

import {
  clampFootprint,
  findContainingSibling,
  findOverlappingSibling,
  findSwallowedPins,
  footprintArea,
  footprintCentre,
  footprintContains,
  footprintsOverlap,
  isDegenerateFootprint,
  isFootprint,
  isSelfIntersecting,
  rectangleFootprint,
  type Bounds,
  type Footprint,
  type Point,
} from "./footprint";

// SPEC-009's rectangles, now four-vertex polygons (SPEC-024 §6). Every
// rectangle case below predates polygons and is kept unchanged: it is the
// proof that a migrated rectangle behaves exactly as it did.
const rect = (a: Point, b: Point): Footprint => rectangleFootprint(a, b);
const footprint = rect([0, 0], [10, 20]);

// A horseshoe opening upwards: the square [0,0]–[30,30] with the notch
// [10,10]–[30,20] cut out of its top middle. Its centroid falls in the notch.
const horseshoe: Footprint = {
  ring: [
    [0, 0],
    [0, 30],
    [30, 30],
    [30, 20],
    [10, 20],
    [10, 10],
    [30, 10],
    [30, 0],
  ],
};

describe("isFootprint", () => {
  it("accepts a ring of three or more points", () => {
    expect(
      isFootprint({
        ring: [
          [0, 0],
          [0, 10],
          [10, 0],
        ],
      })
    ).toBe(true);
  });

  it("refuses the two-corner rectangle SPEC-009 stored — migrated, not tolerated", () => {
    expect(
      isFootprint([
        [0, 0],
        [10, 20],
      ])
    ).toBe(false);
  });

  it("refuses fewer than three vertices, and non-numeric ones", () => {
    expect(
      isFootprint({
        ring: [
          [0, 0],
          [0, 10],
        ],
      })
    ).toBe(false);
    expect(
      isFootprint({
        ring: [
          [0, 0],
          [0, 10],
          ["x", 1],
        ],
      })
    ).toBe(false);
    expect(isFootprint(null)).toBe(false);
  });
});

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

  it("excludes a point in a concave shape's notch, though inside its bounding box", () => {
    expect(footprintContains(horseshoe, [20, 15])).toBe(false);
    expect(footprintContains(horseshoe, [5, 15])).toBe(true);
  });
});

describe("footprintsOverlap", () => {
  it("detects a partial overlap", () => {
    expect(footprintsOverlap(footprint, rect([5, 15], [15, 25]))).toBe(true);
  });

  it("detects one rectangle entirely inside another", () => {
    const inner = rect([2, 2], [8, 8]);
    expect(footprintsOverlap(footprint, inner)).toBe(true);
    expect(footprintsOverlap(inner, footprint)).toBe(true);
  });

  it("does not consider rectangles that only touch on an edge as overlapping", () => {
    expect(footprintsOverlap(footprint, rect([0, 20], [10, 30]))).toBe(false);
  });

  it("does not consider rectangles that only touch at a corner as overlapping", () => {
    expect(footprintsOverlap(footprint, rect([10, 20], [20, 30]))).toBe(false);
  });

  it("does not consider disjoint rectangles as overlapping", () => {
    expect(footprintsOverlap(footprint, rect([100, 100], [110, 110]))).toBe(
      false
    );
  });

  it("lets an area sit inside a neighbour's notch — the bounding boxes overlap, the ground does not", () => {
    const inTheNotch = rect([12, 12], [28, 18]);
    expect(footprintsOverlap(horseshoe, inTheNotch)).toBe(false);
  });

  it("refuses an area that reaches into a neighbour's arm by any amount", () => {
    const reachingIn = rect([12, 12], [28, 21]);
    expect(footprintsOverlap(horseshoe, reachingIn)).toBe(true);
  });

  it("does not count a border shared exactly as overlap", () => {
    const fillsTheNotch = rect([10, 10], [30, 20]);
    expect(footprintsOverlap(horseshoe, fillsTheNotch)).toBe(false);
  });
});

describe("isSelfIntersecting", () => {
  it("flags an outline that crosses itself", () => {
    const bowtie: Footprint = {
      ring: [
        [0, 0],
        [10, 10],
        [10, 0],
        [0, 10],
      ],
    };
    expect(isSelfIntersecting(bowtie)).toBe(true);
  });

  it("passes a simple polygon, concave or not", () => {
    expect(isSelfIntersecting(footprint)).toBe(false);
    expect(isSelfIntersecting(horseshoe)).toBe(false);
  });
});

describe("footprintArea", () => {
  it("measures a rectangle and a concave polygon, whatever the winding", () => {
    expect(footprintArea(footprint)).toBe(200);
    expect(footprintArea(horseshoe)).toBe(900 - 200);
    expect(footprintArea({ ring: [...horseshoe.ring].reverse() })).toBe(700);
  });
});

describe("isDegenerateFootprint", () => {
  const parentMapBounds: Bounds = [
    [0, 0],
    [100, 100],
  ];

  it("flags a rectangle below the 1% threshold on one side", () => {
    expect(
      isDegenerateFootprint(rect([0, 0], [0.5, 50]), parentMapBounds)
    ).toBe(true);
  });

  it("flags a rectangle below the threshold on both sides", () => {
    expect(
      isDegenerateFootprint(rect([0, 0], [0.5, 0.5]), parentMapBounds)
    ).toBe(true);
  });

  it("does not flag a rectangle exactly at the threshold", () => {
    expect(isDegenerateFootprint(rect([0, 0], [1, 1]), parentMapBounds)).toBe(
      false
    );
  });

  it("does not flag a comfortably sized rectangle", () => {
    expect(
      isDegenerateFootprint(rect([10, 10], [50, 50]), parentMapBounds)
    ).toBe(false);
  });

  it("flags a hairline sliver whose bounding box looks healthy", () => {
    const sliver: Footprint = {
      ring: [
        [0, 0],
        [50, 50],
        [50, 50.01],
      ],
    };
    expect(isDegenerateFootprint(sliver, parentMapBounds)).toBe(true);
  });
});

describe("footprintCentre", () => {
  it("returns the midpoint of a rectangle", () => {
    const [lat, lng] = footprintCentre(footprint);
    expect(lat).toBeCloseTo(5, 1);
    expect(lng).toBeCloseTo(10, 1);
  });

  it("returns the midpoint of a non-square rectangle", () => {
    const [lat, lng] = footprintCentre(rect([-10, 0], [10, 100]));
    expect(lat).toBeCloseTo(0, 1);
    expect(lng).toBeCloseTo(50, 0);
  });

  it("puts a concave shape's centre inside it, never in its notch (SPEC-024 §5)", () => {
    const centre = footprintCentre(horseshoe);
    expect(footprintContains(horseshoe, centre)).toBe(true);
  });
});

describe("clampFootprint", () => {
  it("pulls every vertex into the map's bounds", () => {
    const bounds: Bounds = [
      [0, 0],
      [100, 100],
    ];
    const outside: Footprint = {
      ring: [
        [-5, 50],
        [50, 120],
        [110, -3],
      ],
    };
    expect(clampFootprint(outside, bounds).ring).toEqual([
      [0, 50],
      [50, 100],
      [100, 0],
    ]);
  });
});

describe("findOverlappingSibling", () => {
  const siblings = [
    { title: "Kang", footprint },
    { title: "Neighbour", footprint: rect([0, 20], [10, 30]) },
  ];

  it("returns the first sibling whose footprint overlaps", () => {
    expect(findOverlappingSibling(rect([2, 2], [8, 8]), siblings)).toBe(
      siblings[0]
    );
  });

  it("does not flag a sibling that only touches at an edge", () => {
    expect(
      findOverlappingSibling(rect([20, 20], [30, 30]), siblings)
    ).toBeUndefined();
  });

  it("returns undefined when nothing overlaps", () => {
    expect(
      findOverlappingSibling(rect([200, 200], [210, 210]), siblings)
    ).toBeUndefined();
  });
});

describe("findContainingSibling", () => {
  const siblings = [{ title: "Kang", footprint }];

  it("returns the sibling area containing the point", () => {
    expect(findContainingSibling([5, 10], siblings)).toBe(siblings[0]);
  });

  it("returns the sibling when the point sits exactly on its edge", () => {
    expect(findContainingSibling([0, 10], siblings)).toBe(siblings[0]);
  });

  it("returns undefined when no sibling contains the point", () => {
    expect(findContainingSibling([50, 50], siblings)).toBeUndefined();
  });
});

describe("findSwallowedPins", () => {
  const pins = [
    { title: "Village", lat: 5, lng: 10 },
    { title: "Watchtower", lat: 0, lng: 20 },
    { title: "Far away", lat: 500, lng: 500 },
  ];

  it("returns every pin the footprint covers, including one exactly on the edge", () => {
    expect(findSwallowedPins(footprint, pins)).toEqual([pins[0], pins[1]]);
  });

  it("returns an empty array when no pin is covered", () => {
    expect(findSwallowedPins(rect([900, 900], [910, 910]), pins)).toEqual([]);
  });

  it("leaves a pin in a concave shape's notch alone", () => {
    const inNotch = [{ title: "Fishing hut", lat: 20, lng: 15 }];
    expect(findSwallowedPins(horseshoe, inNotch)).toEqual([]);
  });
});

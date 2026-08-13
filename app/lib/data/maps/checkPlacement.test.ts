import { beforeEach, describe, expect, it, vi } from "vitest";

const { findMany, findUnique, poiFindMany } = vi.hoisted(() => ({
  findMany: vi.fn(),
  findUnique: vi.fn(),
  poiFindMany: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    zone: { findMany, findUnique },
    poi: { findMany: poiFindMany },
  },
}));

import { checkAreaPlacement, checkPointPlacement } from "./checkPlacement";

const parentBounds = {
  mapBounds: [
    [0, 0],
    [100, 100],
  ],
};

describe("checkAreaPlacement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    poiFindMany.mockResolvedValue([]);
    findUnique.mockResolvedValue(parentBounds);
  });

  // Simulates Prisma's own `id: { not }` filtering, which a bare `vi.fn()`
  // mock does not do on its own — a mock that ignores `where` entirely would
  // let this exact trap (self-exclusion never wired in) pass silently.
  const rowsFilteredByWhere = <T extends { id: number }>(
    rows: T[],
    args: { where?: { id?: { not?: number } } }
  ) => rows.filter((row) => row.id !== args.where?.id?.not);

  it("does not refuse a resize against its own unchanged footprint (excludeZoneId)", async () => {
    // The trap: without excluding the row being resized, its own footprint
    // comes back in the sibling query and `findOverlappingSibling` finds it
    // overlapping itself, so every resize is refused.
    const rows = [
      {
        id: 7,
        title: "Kang",
        lat: 30,
        lng: 30,
        footprint: [
          [10, 10],
          [50, 50],
        ],
      },
    ];
    findMany.mockImplementation((args: { where?: { id?: { not?: number } } }) =>
      rowsFilteredByWhere(rows, args)
    );

    const result = await checkAreaPlacement({
      parentId: 1,
      footprint: [
        [10, 10],
        [60, 60],
      ],
      excludeZoneId: 7,
    });

    expect(result).toBeNull();
  });

  it("refuses a resize that would overlap a sibling area", async () => {
    const rows = [
      {
        id: 7,
        title: "Kang",
        lat: 30,
        lng: 30,
        footprint: [
          [10, 10],
          [50, 50],
        ],
      },
      {
        id: 8,
        title: "Orc Kingdom",
        lat: 70,
        lng: 70,
        footprint: [
          [60, 60],
          [90, 90],
        ],
      },
    ];
    findMany.mockImplementation((args: { where?: { id?: { not?: number } } }) =>
      rowsFilteredByWhere(rows, args)
    );

    const result = await checkAreaPlacement({
      parentId: 1,
      footprint: [
        [10, 10],
        [65, 65],
      ],
      excludeZoneId: 7,
    });

    expect(result).toEqual({
      footprint: ["Overlaps an existing area: Orc Kingdom."],
    });
  });

  it("refuses a resize that would swallow a pin", async () => {
    const rows = [
      {
        id: 7,
        title: "Kang",
        lat: 30,
        lng: 30,
        footprint: [
          [10, 10],
          [50, 50],
        ],
      },
      {
        id: 9,
        title: "Skreebars",
        lat: 55,
        lng: 55,
        footprint: null,
      },
    ];
    findMany.mockImplementation((args: { where?: { id?: { not?: number } } }) =>
      rowsFilteredByWhere(rows, args)
    );

    const result = await checkAreaPlacement({
      parentId: 1,
      footprint: [
        [10, 10],
        [60, 60],
      ],
      excludeZoneId: 7,
    });

    expect(result).toEqual({
      footprint: ["Would cover existing place(s): Skreebars."],
    });
  });

  it("ignores an unpositioned landmark rather than crashing (SPEC-010 T1)", async () => {
    findMany.mockResolvedValue([]);
    poiFindMany.mockResolvedValue([
      { title: "Adrift Shrine", lat: null, lng: null },
    ]);

    const result = await checkAreaPlacement({
      parentId: 1,
      footprint: [
        [10, 10],
        [60, 60],
      ],
    });

    expect(result).toBeNull();
  });

  it("refuses a degenerate footprint", async () => {
    findMany.mockResolvedValue([]);

    const result = await checkAreaPlacement({
      parentId: 1,
      footprint: [
        [10, 10],
        [10.05, 10.05],
      ],
    });

    expect(result).toEqual({
      footprint: ["This area is too small to draw."],
    });
  });
});

describe("checkPointPlacement", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("refuses a point moved inside a sibling area", async () => {
    findMany.mockResolvedValue([
      {
        title: "Kang",
        footprint: [
          [10, 10],
          [50, 50],
        ],
      },
    ]);

    const result = await checkPointPlacement({
      parentId: 1,
      point: [20, 20],
    });

    expect(result).toEqual({
      lat: ["This point is inside an existing area: Kang."],
    });
  });

  it("allows an ordinary point move with no containing sibling", async () => {
    findMany.mockResolvedValue([]);

    const result = await checkPointPlacement({
      parentId: 1,
      point: [20, 20],
      excludeZoneId: 9,
    });

    expect(result).toBeNull();
  });

  it("excludes the moved zone's own row from the sibling query", async () => {
    findMany.mockResolvedValue([]);

    await checkPointPlacement({
      parentId: 1,
      point: [20, 20],
      excludeZoneId: 9,
    });

    expect(findMany).toHaveBeenCalledWith({
      where: { parentId: 1, id: { not: 9 } },
      select: { title: true, footprint: true },
    });
  });
});

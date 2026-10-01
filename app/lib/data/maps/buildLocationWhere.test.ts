import { beforeEach, describe, expect, it, vi } from "vitest";

const { zoneFindMany } = vi.hoisted(() => ({ zoneFindMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { zone: { findMany: zoneFindMany } },
}));

import buildLocationWhere from "./buildLocationWhere";

const ALL = { kind: "all" } as const;

describe("buildLocationWhere", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("leaves the where clause untouched when neither param is present", async () => {
    const result = await buildLocationWhere({ name: "foo" }, {}, ALL);

    expect(result).toEqual({ name: "foo" });
    expect(zoneFindMany).not.toHaveBeenCalled();
  });

  it("filters to zoneId IS NULL for the Sconosciuta sentinel", async () => {
    const result = await buildLocationWhere({}, { zoneId: "none" }, ALL);

    expect(result).toEqual({ zoneId: null });
  });

  it("resolves a zoneId to its descendant-inclusive IN list", async () => {
    zoneFindMany.mockResolvedValue([
      { id: 1, parentId: null },
      { id: 2, parentId: 1 },
    ]);

    const result = await buildLocationWhere({}, { zoneId: "1" }, ALL);

    expect(result).toEqual({ zoneId: { in: [1, 2] } });
  });

  it("ignores a non-numeric zoneId", async () => {
    const result = await buildLocationWhere(
      { name: "foo" },
      { zoneId: "abc" },
      ALL
    );

    expect(result).toEqual({ name: "foo" });
    expect(zoneFindMany).not.toHaveBeenCalled();
  });

  it("layers a poiId filter on top of the zone filter", async () => {
    zoneFindMany.mockResolvedValue([{ id: 1, parentId: null }]);

    const result = await buildLocationWhere(
      {},
      { zoneId: "1", poiId: "9" },
      ALL
    );

    expect(result).toEqual({ zoneId: { in: [1] }, poiId: 9 });
  });

  it("applies a poiId filter with no zoneId present", async () => {
    const result = await buildLocationWhere({}, { poiId: "9" }, ALL);

    expect(result).toEqual({ poiId: 9 });
  });
});

// SPEC-022 T8b: a hidden place is no place to a player.
describe("buildLocationWhere for a player", () => {
  const player = {
    kind: "campaign" as const,
    campaignId: 7,
    zones: new Set([1, 2]),
    pois: new Set([20]),
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("counts a record pinned to a hidden place as Sconosciuta", async () => {
    const result = await buildLocationWhere({}, { zoneId: "none" }, player);

    expect(result).toEqual({
      OR: [{ zoneId: null }, { zoneId: { notIn: [1, 2] } }],
    });
  });

  it("keeps only the visible zones of the subtree", async () => {
    zoneFindMany.mockResolvedValue([
      { id: 1, parentId: null },
      { id: 2, parentId: 1 },
      { id: 3, parentId: 1 },
    ]);

    const result = await buildLocationWhere({}, { zoneId: "1" }, player);

    expect(result).toEqual({ zoneId: { in: [1, 2] } });
  });

  it("matches no one in a hidden zone", async () => {
    zoneFindMany.mockResolvedValue([
      { id: 1, parentId: null },
      { id: 3, parentId: 1 },
    ]);

    const result = await buildLocationWhere({}, { zoneId: "3" }, player);

    expect(result).toEqual({ zoneId: { in: [] } });
  });

  it("matches no one at a hidden landmark, and keeps a visible one", async () => {
    await expect(
      buildLocationWhere({}, { poiId: "21" }, player)
    ).resolves.toEqual({ poiId: { in: [] } });
    await expect(
      buildLocationWhere({}, { poiId: "20" }, player)
    ).resolves.toEqual({ poiId: 20 });
  });
});

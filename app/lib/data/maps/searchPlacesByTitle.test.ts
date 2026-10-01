import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { zone: { findMany } },
}));

// SPEC-022 T8c: the reader's scope; the DM's unless a test says otherwise.
const scope = vi.hoisted((): { current: object } => ({
  current: { kind: "all" },
}));
vi.mock("@/app/lib/data/visibility/getVisibilityScope", () => ({
  default: () => Promise.resolve(scope.current),
}));

import searchPlacesByTitle from "./searchPlacesByTitle";

describe("searchPlacesByTitle (SPEC-011 T1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    scope.current = { kind: "all" };
  });

  it("returns places matching the term, case-insensitively", async () => {
    findMany.mockResolvedValue([{ id: 1, title: "Skreebars" }]);

    const result = await searchPlacesByTitle("skree");

    expect(result).toEqual([{ id: 1, title: "Skreebars" }]);
    expect(findMany).toHaveBeenCalledWith({
      where: { title: { contains: "skree", mode: "insensitive" } },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
  });

  it("returns an empty array for an empty term without querying", async () => {
    const result = await searchPlacesByTitle("");

    expect(result).toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("returns an empty array when nothing matches", async () => {
    findMany.mockResolvedValue([]);

    await expect(searchPlacesByTitle("nonexistent")).resolves.toEqual([]);
  });

  it("wraps a query failure in a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("connection lost"));

    await expect(searchPlacesByTitle("skree")).rejects.toBeInstanceOf(
      DatabaseError
    );
  });
});

// SPEC-022 T8c (R10): a hidden place's name never turns up for a player.
describe("searchPlacesByTitle for a player", () => {
  it("searches only the places the campaign can see", async () => {
    scope.current = {
      kind: "campaign",
      campaignId: 7,
      zones: new Set([1, 4]),
      pois: new Set(),
    };
    findMany.mockResolvedValue([]);

    await searchPlacesByTitle("skree");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          title: { contains: "skree", mode: "insensitive" },
          id: { in: [1, 4] },
        },
      })
    );
  });
});

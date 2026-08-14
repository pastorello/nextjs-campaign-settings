import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { zone: { findMany } },
}));

import searchPlacesByTitle from "./searchPlacesByTitle";

describe("searchPlacesByTitle (SPEC-011 T1)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
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

import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import DatabaseError from "@/app/lib/errors/DatabaseError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { zone: { findMany } },
}));

import fetchZoneDescendantIds from "./fetchZoneDescendantIds";

describe("fetchZoneDescendantIds", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(fetchZoneDescendantIds(1)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(findMany).not.toHaveBeenCalled();
  });

  it("includes the zone itself when it has no children", async () => {
    findMany.mockResolvedValue([{ id: 5, parentId: null }]);

    const result = await fetchZoneDescendantIds(5);

    expect(result).toEqual([5]);
  });

  it("includes every descendant at any depth", async () => {
    findMany.mockResolvedValue([
      { id: 1, parentId: null }, // Kang (root)
      { id: 2, parentId: 1 }, // Skreebars (city, under Kang)
      { id: 3, parentId: 2 }, // a district under Skreebars
      { id: 4, parentId: 3 }, // a street under the district
      { id: 5, parentId: null }, // an unrelated zone elsewhere
    ]);

    const result = await fetchZoneDescendantIds(1);

    expect(result.sort()).toEqual([1, 2, 3, 4]);
  });

  it("does not hang on a corrupt self-referencing cycle", async () => {
    findMany.mockResolvedValue([
      { id: 1, parentId: 2 },
      { id: 2, parentId: 1 },
    ]);

    const result = await fetchZoneDescendantIds(1);

    expect(result.sort()).toEqual([1, 2]);
  });

  it("wraps a query failure in a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("connection lost"));

    await expect(fetchZoneDescendantIds(1)).rejects.toBeInstanceOf(
      DatabaseError
    );
  });
});

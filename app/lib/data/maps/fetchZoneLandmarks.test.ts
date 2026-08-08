import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import DatabaseError from "@/app/lib/errors/DatabaseError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { poi: { findMany } },
}));

import fetchZoneLandmarks from "./fetchZoneLandmarks";

describe("fetchZoneLandmarks", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(fetchZoneLandmarks(5)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(findMany).not.toHaveBeenCalled();
  });

  it("returns every landmark scoped to the given zone, alphabetically", async () => {
    findMany.mockResolvedValue([{ id: 9, title: "Locanda del Cinghiale" }]);

    const result = await fetchZoneLandmarks(5);

    expect(result).toEqual([{ id: 9, title: "Locanda del Cinghiale" }]);
    expect(findMany).toHaveBeenCalledWith({
      where: { kind: "poi", parentId: 5 },
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
  });

  it("wraps a query failure in a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("connection lost"));

    await expect(fetchZoneLandmarks(5)).rejects.toBeInstanceOf(DatabaseError);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import DatabaseError from "@/app/lib/errors/DatabaseError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { zone: { findMany } },
}));

import fetchZones from "./fetchZones";

describe("fetchZones", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(fetchZones()).rejects.toBeInstanceOf(UnauthorizedError);
    expect(findMany).not.toHaveBeenCalled();
  });

  it("returns every zone alphabetically", async () => {
    findMany.mockResolvedValue([{ id: 1, title: "Skreebars" }]);

    const result = await fetchZones();

    expect(result).toEqual([{ id: 1, title: "Skreebars" }]);
    expect(findMany).toHaveBeenCalledWith({
      select: { id: true, title: true },
      orderBy: { title: "asc" },
    });
  });

  it("wraps a query failure in a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("connection lost"));

    await expect(fetchZones()).rejects.toBeInstanceOf(DatabaseError);
  });
});

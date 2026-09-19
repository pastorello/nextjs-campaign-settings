import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dhSubclass: { findUnique } },
}));

import fetchDhSubclassClassId from "./fetchDhSubclassClassId";

describe("fetchDhSubclassClassId (SPEC-021 T7)", () => {
  beforeEach(() => {
    findUnique.mockReset();
  });

  it("returns the subclass's class", async () => {
    findUnique.mockResolvedValue({ classId: 7 });

    expect(await fetchDhSubclassClassId(11)).toBe(7);
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: 11 },
      select: { classId: true },
    });
  });

  it("returns null when there is no such subclass", async () => {
    findUnique.mockResolvedValue(null);

    expect(await fetchDhSubclassClassId(99)).toBeNull();
  });

  it("wraps a database failure", async () => {
    findUnique.mockRejectedValue(new Error("down"));

    await expect(fetchDhSubclassClassId(11)).rejects.toBeInstanceOf(
      DatabaseError
    );
  });
});

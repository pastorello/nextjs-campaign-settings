import { beforeEach, describe, expect, it, vi } from "vitest";

import NotFoundError from "@/app/lib/errors/NotFoundError";
import DatabaseError from "@/app/lib/errors/DatabaseError";

const { findUnique, del } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  del: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { treasure: { findUnique, delete: del } },
}));

import { deleteTreasureById } from "./deleteTreasureById";

describe("deleteTreasureById (SPEC-013 T4b)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes an existing treasure entry", async () => {
    findUnique.mockResolvedValue({ id: 1 });
    del.mockResolvedValue({});

    await deleteTreasureById(1);

    expect(del).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("throws NotFoundError for a missing treasure entry without deleting", async () => {
    findUnique.mockResolvedValue(null);

    await expect(deleteTreasureById(999)).rejects.toBeInstanceOf(NotFoundError);
    expect(del).not.toHaveBeenCalled();
  });

  it("wraps a lookup failure in a DatabaseError", async () => {
    findUnique.mockRejectedValue(new Error("connection lost"));

    await expect(deleteTreasureById(1)).rejects.toBeInstanceOf(DatabaseError);
  });

  it("wraps a delete failure in a DatabaseError", async () => {
    findUnique.mockResolvedValue({ id: 1 });
    del.mockRejectedValue(new Error("constraint violation"));

    await expect(deleteTreasureById(1)).rejects.toBeInstanceOf(DatabaseError);
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import NotFoundError from "@/app/lib/errors/NotFoundError";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import ConflictError from "@/app/lib/errors/ConflictError";

const { findUnique, findManyNpc, del } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  findManyNpc: vi.fn(),
  del: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    faction: { findUnique, delete: del },
    npc: { findMany: findManyNpc },
  },
}));

import { deleteFactionById } from "./deleteFactionById";

describe("deleteFactionById (SPEC-006 T4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes a faction no NPC references", async () => {
    findUnique.mockResolvedValue({ id: 1, name: "Regno Bianco" });
    findManyNpc.mockResolvedValue([]);
    del.mockResolvedValue({});

    await deleteFactionById(1);

    expect(del).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("refuses to delete a faction NPCs still reference, naming them", async () => {
    findUnique.mockResolvedValue({ id: 1, name: "Regno di Kang" });
    findManyNpc.mockResolvedValue([
      { name: "Re Kang III" },
      { name: "Lord Verminaard" },
    ]);

    const error = await deleteFactionById(1).catch((e: unknown) => e);

    expect(error).toBeInstanceOf(ConflictError);
    expect((error as ConflictError).message).toContain("Re Kang III");
    expect((error as ConflictError).message).toContain("Lord Verminaard");
    expect(del).not.toHaveBeenCalled();
  });

  it("throws NotFoundError for a missing faction without deleting", async () => {
    findUnique.mockResolvedValue(null);

    await expect(deleteFactionById(999)).rejects.toBeInstanceOf(NotFoundError);
    expect(del).not.toHaveBeenCalled();
  });

  it("wraps a lookup failure in a DatabaseError", async () => {
    findUnique.mockRejectedValue(new Error("connection lost"));

    await expect(deleteFactionById(1)).rejects.toBeInstanceOf(DatabaseError);
  });

  it("wraps a reference-check failure in a DatabaseError", async () => {
    findUnique.mockResolvedValue({ id: 1, name: "Regno Bianco" });
    findManyNpc.mockRejectedValue(new Error("connection lost"));

    await expect(deleteFactionById(1)).rejects.toBeInstanceOf(DatabaseError);
  });

  it("wraps a delete failure in a DatabaseError", async () => {
    findUnique.mockResolvedValue({ id: 1, name: "Regno Bianco" });
    findManyNpc.mockResolvedValue([]);
    del.mockRejectedValue(new Error("constraint violation"));

    await expect(deleteFactionById(1)).rejects.toBeInstanceOf(DatabaseError);
  });
});

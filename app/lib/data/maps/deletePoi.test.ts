import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { Prisma } from "@/generated/prisma/client";
import NotFoundError from "@/app/lib/errors/NotFoundError";
import DatabaseError from "@/app/lib/errors/DatabaseError";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// `vi.hoisted` — see createPoi.test.ts for why a plain top-level `const`
// doesn't work here, and why this avoids `vi.mocked(prisma.poi.x)`.
const { findUnique, del, npcUpdateMany, deitiesUpdateMany, transaction } =
  vi.hoisted(() => ({
    findUnique: vi.fn(),
    del: vi.fn(),
    npcUpdateMany: vi.fn(),
    deitiesUpdateMany: vi.fn(),
    transaction: vi.fn(),
  }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    poi: { findUnique, delete: del },
    npc: { updateMany: npcUpdateMany },
    deities: { updateMany: deitiesUpdateMany },
    $transaction: transaction,
  },
}));

import deletePoi from "./deletePoi";

describe("deletePoi", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { name: "dm", role: "dm" },
    } as never);
    del.mockResolvedValue({});
    npcUpdateMany.mockResolvedValue({ count: 0 });
    deitiesUpdateMany.mockResolvedValue({ count: 0 });
    transaction.mockImplementation(async (ops: Promise<unknown>[]) =>
      Promise.all(ops)
    );
  });

  it("deletes an existing POI", async () => {
    findUnique.mockResolvedValue({ id: 1 });

    await deletePoi(1);

    expect(del).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("throws NotFoundError for a missing POI without writing anything", async () => {
    findUnique.mockResolvedValue(null);

    await expect(deletePoi(999)).rejects.toBeInstanceOf(NotFoundError);
    expect(transaction).not.toHaveBeenCalled();
    expect(del).not.toHaveBeenCalled();
  });

  // TD-147: `npc.poiId`/`deities.poiId` are `onDelete: Restrict`, so a bare
  // delete of a landmark somebody is assigned to failed in Postgres. The
  // DM's decision (2026-09-30): the entity keeps its `zoneId` — the place
  // that enclosed the landmark — and loses only `poiId`.
  it("clears poiId, and only poiId, on the NPCs assigned to the landmark", async () => {
    findUnique.mockResolvedValue({ id: 7 });

    await deletePoi(7);

    expect(npcUpdateMany).toHaveBeenCalledWith({
      where: { poiId: 7 },
      data: { poiId: null },
    });
  });

  it("clears poiId, and only poiId, on the deities assigned to the landmark", async () => {
    findUnique.mockResolvedValue({ id: 7 });

    await deletePoi(7);

    expect(deitiesUpdateMany).toHaveBeenCalledWith({
      where: { poiId: 7 },
      data: { poiId: null },
    });
  });

  it("detaches the entities before the delete, in one transaction", async () => {
    findUnique.mockResolvedValue({ id: 7 });
    const calls: string[] = [];
    npcUpdateMany.mockImplementation(() => {
      calls.push("npc");
      return Promise.resolve({ count: 1 });
    });
    deitiesUpdateMany.mockImplementation(() => {
      calls.push("deities");
      return Promise.resolve({ count: 1 });
    });
    del.mockImplementation(() => {
      calls.push("delete");
      return Promise.resolve({});
    });

    await deletePoi(7);

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(calls).toHaveLength(3);
    // The delete is last: Postgres checks the `Restrict` foreign keys
    // statement by statement, so it has to run once nothing points at it.
    expect(calls.at(-1)).toBe("delete");
  });

  it("reports the landmark already gone when a race loses to another delete", async () => {
    findUnique.mockResolvedValue({ id: 7 });
    transaction.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Record not found", {
        code: "P2025",
        clientVersion: "test",
      })
    );

    await expect(deletePoi(7)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("wraps any other mid-transaction failure in a DatabaseError", async () => {
    findUnique.mockResolvedValue({ id: 7 });
    transaction.mockRejectedValue(new Error("connection lost"));

    await expect(deletePoi(7)).rejects.toBeInstanceOf(DatabaseError);
  });
});

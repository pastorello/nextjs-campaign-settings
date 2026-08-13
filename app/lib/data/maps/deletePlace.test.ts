import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { Prisma } from "@/generated/prisma/client";
import NotFoundError from "@/app/lib/errors/NotFoundError";
import ConflictError from "@/app/lib/errors/ConflictError";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

// `vi.hoisted` — see createPoi.test.ts for why a plain top-level `const`
// doesn't work here, and why this avoids `vi.mocked(prisma.x.y)`.
const {
  findUnique,
  zoneUpdateMany,
  poiUpdateMany,
  npcUpdateMany,
  deitiesUpdateMany,
  zoneDelete,
  transaction,
} = vi.hoisted(() => ({
  findUnique: vi.fn(),
  zoneUpdateMany: vi.fn().mockResolvedValue({ count: 0 }),
  poiUpdateMany: vi.fn().mockResolvedValue({ count: 0 }),
  npcUpdateMany: vi.fn().mockResolvedValue({ count: 0 }),
  deitiesUpdateMany: vi.fn().mockResolvedValue({ count: 0 }),
  zoneDelete: vi.fn().mockResolvedValue({}),
  transaction: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    zone: { findUnique, updateMany: zoneUpdateMany, delete: zoneDelete },
    poi: { updateMany: poiUpdateMany },
    npc: { updateMany: npcUpdateMany },
    deities: { updateMany: deitiesUpdateMany },
    $transaction: transaction,
  },
}));

import deletePlace from "./deletePlace";

describe("deletePlace (SPEC-010 T2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    zoneUpdateMany.mockResolvedValue({ count: 0 });
    poiUpdateMany.mockResolvedValue({ count: 0 });
    npcUpdateMany.mockResolvedValue({ count: 0 });
    deitiesUpdateMany.mockResolvedValue({ count: 0 });
    zoneDelete.mockResolvedValue({});
    transaction.mockImplementation(async (ops: Promise<unknown>[]) =>
      Promise.all(ops)
    );
  });

  it("rejects an unauthenticated request", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(deletePlace(1)).rejects.toBeInstanceOf(UnauthorizedError);
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("refuses to delete the root, with no override", async () => {
    findUnique.mockResolvedValue({ id: 1, parentId: null });

    await expect(deletePlace(1)).rejects.toBeInstanceOf(ConflictError);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("throws NotFoundError for a missing place without writing anything", async () => {
    findUnique.mockResolvedValue(null);

    await expect(deletePlace(999)).rejects.toBeInstanceOf(NotFoundError);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("reparents direct child zones to the grandparent and clears their coordinates", async () => {
    findUnique.mockResolvedValue({ id: 5, parentId: 2 });

    await deletePlace(5);

    expect(zoneUpdateMany).toHaveBeenCalledWith({
      where: { parentId: 5 },
      data: { parentId: 2, lat: null, lng: null },
    });
  });

  it("reparents landmarks to the grandparent and clears their coordinates", async () => {
    findUnique.mockResolvedValue({ id: 5, parentId: 2 });

    await deletePlace(5);

    expect(poiUpdateMany).toHaveBeenCalledWith({
      where: { zoneId: 5 },
      data: { zoneId: 2, lat: null, lng: null },
    });
  });

  it("clears zoneId for entities assigned directly to the place (no landmark)", async () => {
    findUnique.mockResolvedValue({ id: 5, parentId: 2 });

    await deletePlace(5);

    expect(npcUpdateMany).toHaveBeenCalledWith({
      where: { zoneId: 5, poiId: null },
      data: { zoneId: null },
    });
    expect(deitiesUpdateMany).toHaveBeenCalledWith({
      where: { zoneId: 5, poiId: null },
      data: { zoneId: null },
    });
  });

  it("moves zoneId to the grandparent, keeping poiId, for entities on a landmark inside the place", async () => {
    findUnique.mockResolvedValue({ id: 5, parentId: 2 });

    await deletePlace(5);

    expect(npcUpdateMany).toHaveBeenCalledWith({
      where: { zoneId: 5, poiId: { not: null } },
      data: { zoneId: 2 },
    });
    expect(deitiesUpdateMany).toHaveBeenCalledWith({
      where: { zoneId: 5, poiId: { not: null } },
      data: { zoneId: 2 },
    });
  });

  it("deletes the place row itself, in the same transaction", async () => {
    findUnique.mockResolvedValue({ id: 5, parentId: 2 });

    await deletePlace(5);

    expect(transaction).toHaveBeenCalledTimes(1);
    expect(zoneDelete).toHaveBeenCalledWith({ where: { id: 5 } });
  });

  it("reports the place already gone when a race loses to another delete", async () => {
    findUnique.mockResolvedValue({ id: 5, parentId: 2 });
    const p2025 = new Prisma.PrismaClientKnownRequestError("Record not found", {
      code: "P2025",
      clientVersion: "test",
    });
    transaction.mockRejectedValue(p2025);

    await expect(deletePlace(5)).rejects.toBeInstanceOf(NotFoundError);
  });

  it("wraps any other mid-transaction failure in a DatabaseError, leaving the write unconfirmed", async () => {
    findUnique.mockResolvedValue({ id: 5, parentId: 2 });
    transaction.mockRejectedValue(new Error("connection lost"));

    await expect(deletePlace(5)).rejects.toBeInstanceOf(DatabaseError);
  });
});

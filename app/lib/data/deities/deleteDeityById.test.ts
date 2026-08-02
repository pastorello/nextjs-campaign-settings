import { beforeEach, describe, expect, it, vi } from "vitest";

import NotFoundError from "@/app/lib/errors/NotFoundError";
import DatabaseError from "@/app/lib/errors/DatabaseError";

// Direct hoisted references, not `vi.mocked(prisma.deities.x)` — see
// `createPoi.test.ts` for why the latter trips `unbound-method`.
const { findUnique, del } = vi.hoisted(() => ({
  findUnique: vi.fn(),
  del: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { deities: { findUnique, delete: del } },
}));

import { deleteDeityById } from "./deleteDeityById";

describe("deleteDeityById (TD-38)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("deletes an existing deity", async () => {
    findUnique.mockResolvedValue({ id: 1 });
    del.mockResolvedValue({});

    await deleteDeityById(1);

    expect(del).toHaveBeenCalledWith({ where: { id: 1 } });
  });

  it("throws NotFoundError for a missing deity without deleting", async () => {
    findUnique.mockResolvedValue(null);

    await expect(deleteDeityById(999)).rejects.toBeInstanceOf(NotFoundError);
    expect(del).not.toHaveBeenCalled();
  });

  it("wraps a lookup failure in a DatabaseError", async () => {
    findUnique.mockRejectedValue(new Error("connection lost"));

    await expect(deleteDeityById(1)).rejects.toBeInstanceOf(DatabaseError);
  });

  it("wraps a delete failure in a DatabaseError", async () => {
    findUnique.mockResolvedValue({ id: 1 });
    del.mockRejectedValue(new Error("constraint violation"));

    await expect(deleteDeityById(1)).rejects.toBeInstanceOf(DatabaseError);
  });
});

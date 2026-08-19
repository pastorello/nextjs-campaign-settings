import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { findMany, update, transaction } = vi.hoisted(() => ({
  findMany: vi.fn(),
  update: vi.fn(),
  transaction: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { adventure: { findMany, update }, $transaction: transaction },
}));

import reorderAdventures from "./reorderAdventures";

describe("reorderAdventures (SPEC-013 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    transaction.mockImplementation(async (ops: Promise<unknown>[]) =>
      Promise.all(ops)
    );
    update.mockResolvedValue({});
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(reorderAdventures(1, [3, 1, 2])).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rewrites positions 1-indexed in the given order", async () => {
    findMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

    const result = await reorderAdventures(1, [3, 1, 2]);

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenNthCalledWith(1, {
      where: { id: 3 },
      data: { position: 1 },
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      where: { id: 1 },
      data: { position: 2 },
    });
    expect(update).toHaveBeenNthCalledWith(3, {
      where: { id: 2 },
      data: { position: 3 },
    });
  });

  it("rejects an id list that doesn't match the campaign's current ladder", async () => {
    findMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);

    const result = await reorderAdventures(1, [1, 2]);

    expect(result.ok).toBe(false);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects an empty id list, without writing", async () => {
    const result = await reorderAdventures(1, []);

    expect(result.ok).toBe(false);
    expect(findMany).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });
});

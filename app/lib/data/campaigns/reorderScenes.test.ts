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
  default: { scene: { findMany, update }, $transaction: transaction },
}));

import reorderScenes from "./reorderScenes";

describe("reorderScenes (SPEC-013 T6)", () => {
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

    await expect(reorderScenes(7, [2, 1])).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rewrites positions 1-indexed in the given order", async () => {
    findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const result = await reorderScenes(7, [2, 1]);

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenNthCalledWith(1, {
      where: { id: 2 },
      data: { position: 1 },
    });
    expect(update).toHaveBeenNthCalledWith(2, {
      where: { id: 1 },
      data: { position: 2 },
    });
  });

  it("rejects an id list that doesn't match the adventure's current scenes", async () => {
    findMany.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    const result = await reorderScenes(7, [1]);

    expect(result.ok).toBe(false);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects an empty id list, without writing", async () => {
    const result = await reorderScenes(7, []);

    expect(result.ok).toBe(false);
    expect(findMany).not.toHaveBeenCalled();
    expect(transaction).not.toHaveBeenCalled();
  });
});

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
  default: {
    dhClassFeature: { findMany, update },
    $transaction: transaction,
  },
}));

import reorderDhClassFeatures from "./reorderDhClassFeatures";

describe("reorderDhClassFeatures (SPEC-021 T4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    transaction.mockImplementation(async (ops: Promise<unknown>[]) =>
      Promise.all(ops)
    );
    update.mockResolvedValue({});
    findMany.mockResolvedValue([{ id: 1 }, { id: 2 }, { id: 3 }]);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(reorderDhClassFeatures(4, [3, 2, 1])).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rewrites the class's feature positions 1-indexed in the given order", async () => {
    const result = await reorderDhClassFeatures(4, [3, 1, 2]);

    expect(result).toEqual({ ok: true });
    expect(findMany).toHaveBeenCalledWith({
      where: { classId: 4 },
      select: { id: true },
    });
    expect(update.mock.calls).toEqual([
      [{ where: { id: 3 }, data: { position: 1 } }],
      [{ where: { id: 1 }, data: { position: 2 } }],
      [{ where: { id: 2 }, data: { position: 3 } }],
    ]);
  });

  it("refuses a list that is not exactly the class's features", async () => {
    const result = await reorderDhClassFeatures(4, [1, 1, 2]);

    expect(result).toEqual({
      ok: false,
      errors: { orderedIds: [{ key: "classFeatureOrderMismatch" }] },
    });
    expect(transaction).not.toHaveBeenCalled();
  });
});

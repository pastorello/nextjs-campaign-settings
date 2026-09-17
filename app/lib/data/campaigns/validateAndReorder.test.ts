import { beforeEach, describe, expect, it, vi } from "vitest";

const { transaction } = vi.hoisted(() => ({ transaction: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { $transaction: transaction },
}));

import validateAndReorder from "./validateAndReorder";

describe("validateAndReorder (TD-125)", () => {
  const buildPositionUpdate = vi.fn();

  beforeEach(() => {
    vi.clearAllMocks();
    transaction.mockImplementation(async (ops: Promise<unknown>[]) =>
      Promise.all(ops)
    );
    buildPositionUpdate.mockImplementation(() => Promise.resolve({}));
  });

  it("rewrites positions 1-indexed in the given order", async () => {
    const result = await validateAndReorder({
      findExistingIds: () => Promise.resolve([1, 2]),
      buildPositionUpdate,
      orderedIds: [2, 1],
      mismatchMessage: "mismatch",
    });

    expect(result).toEqual({ ok: true });
    expect(buildPositionUpdate).toHaveBeenNthCalledWith(1, 2, 1);
    expect(buildPositionUpdate).toHaveBeenNthCalledWith(2, 1, 2);
  });

  it("rejects a duplicate id even when the list length matches the row count", async () => {
    // Regression for the bug this helper replaces: existing rows {1,2,3},
    // given [1,1,2] used to pass `length === size && every(has)` — 1 is a
    // member, its duplicate is still "every id is a member", and the
    // lengths (3 and 3) match. Row 3 was silently never repositioned and
    // ended up sharing a position with row 1.
    const result = await validateAndReorder({
      findExistingIds: () => Promise.resolve([1, 2, 3]),
      buildPositionUpdate,
      orderedIds: [1, 1, 2],
      mismatchMessage: "mismatch",
    });

    expect(result.ok).toBe(false);
    expect(transaction).not.toHaveBeenCalled();
    expect(buildPositionUpdate).not.toHaveBeenCalled();
  });

  it("rejects an id list missing one of the existing rows", async () => {
    const result = await validateAndReorder({
      findExistingIds: () => Promise.resolve([1, 2, 3]),
      buildPositionUpdate,
      orderedIds: [1, 2],
      mismatchMessage: "mismatch",
    });

    expect(result.ok).toBe(false);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("rejects an id list carrying a foreign id", async () => {
    const result = await validateAndReorder({
      findExistingIds: () => Promise.resolve([1, 2]),
      buildPositionUpdate,
      orderedIds: [1, 999],
      mismatchMessage: "mismatch",
    });

    expect(result.ok).toBe(false);
    expect(transaction).not.toHaveBeenCalled();
  });

  it("returns the given mismatch message under the orderedIds field", async () => {
    const result = await validateAndReorder({
      findExistingIds: () => Promise.resolve([1, 2]),
      buildPositionUpdate,
      orderedIds: [1],
      mismatchMessage: "custom mismatch message",
    });

    expect(result).toEqual({
      ok: false,
      errors: { orderedIds: ["custom mismatch message"] },
    });
  });

  it("wraps a lookup failure in a database error rather than throwing raw", async () => {
    await expect(
      validateAndReorder({
        findExistingIds: () => Promise.reject(new Error("connection refused")),
        buildPositionUpdate,
        orderedIds: [1],
        mismatchMessage: "mismatch",
      })
    ).rejects.toThrow();
    expect(transaction).not.toHaveBeenCalled();
  });

  it("wraps a transaction failure in a database error rather than throwing raw", async () => {
    transaction.mockRejectedValueOnce(new Error("write failed"));

    await expect(
      validateAndReorder({
        findExistingIds: () => Promise.resolve([1]),
        buildPositionUpdate,
        orderedIds: [1],
        mismatchMessage: "mismatch",
      })
    ).rejects.toThrow();
  });
});

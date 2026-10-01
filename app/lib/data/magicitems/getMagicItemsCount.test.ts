import { describe, expect, it, vi } from "vitest";

// SPEC-022 T8b: the DM's scope; the player's has its own suite.
vi.mock("@/app/lib/data/visibility/getVisibilityScope", () => ({
  default: () => Promise.resolve({ kind: "all" }),
}));

const count = vi.fn();
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { magicitems: { count } },
}));

describe("getMagicItemsCount (TD-38)", () => {
  it("returns the total and filtered counts with their page counts", async () => {
    count.mockResolvedValueOnce(40).mockResolvedValueOnce(4);

    const { getMagicItemsCount } = await import("./getMagicItemsCount");
    const result = await getMagicItemsCount(Promise.resolve({}));

    expect(result.total).toBe(40);
    expect(result.filtered).toBe(4);
    expect(result.totalPages).toBeGreaterThan(0);
    expect(result.filteredPages).toBeGreaterThan(0);
  });
});

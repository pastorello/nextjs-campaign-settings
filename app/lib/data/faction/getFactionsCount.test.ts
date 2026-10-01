import { describe, expect, it, vi } from "vitest";

// SPEC-022 T8b: the DM's scope; the player's has its own suite.
vi.mock("@/app/lib/data/visibility/getVisibilityScope", () => ({
  default: () => Promise.resolve({ kind: "all" }),
}));

const count = vi.fn();
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { faction: { count } },
}));

describe("getFactionsCount (SPEC-006 T2)", () => {
  it("returns the total and filtered counts with their page counts", async () => {
    count.mockResolvedValueOnce(21).mockResolvedValueOnce(3);

    const { getFactionsCount } = await import("./getFactionsCount");
    const result = await getFactionsCount(Promise.resolve({}));

    expect(result.total).toBe(21);
    expect(result.filtered).toBe(3);
    expect(result.totalPages).toBeGreaterThan(0);
    expect(result.filteredPages).toBeGreaterThan(0);
  });
});

import { describe, expect, it, vi } from "vitest";

const count = vi.fn();
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { treasure: { count } },
}));

describe("getTreasuresCount (SPEC-013 T4b)", () => {
  it("returns the total and filtered counts with their page counts", async () => {
    count.mockResolvedValueOnce(40).mockResolvedValueOnce(4);

    const { getTreasuresCount } = await import("./getTreasuresCount");
    const result = await getTreasuresCount(Promise.resolve({}));

    expect(result.total).toBe(40);
    expect(result.filtered).toBe(4);
    expect(result.totalPages).toBeGreaterThan(0);
    expect(result.filteredPages).toBeGreaterThan(0);
  });
});

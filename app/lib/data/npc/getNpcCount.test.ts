import { describe, expect, it, vi } from "vitest";

// getNpcCount now threads a zoneId/poiId filter (SPEC-008 T6) through
// buildLocationWhere, which — for the zoneId branch only — calls
// requireSession(); mocked here so the real next-auth config module never
// loads, regardless of whether that branch actually runs in a given test.
vi.mock("@/auth", () => ({ auth: vi.fn() }));

const count = vi.fn();
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { npc: { count } },
}));

describe("getNpcCount (TD-38)", () => {
  it("returns the total and filtered counts with their page counts", async () => {
    count.mockResolvedValueOnce(40).mockResolvedValueOnce(4);

    const { getNpcCount } = await import("./getNpcCount");
    const result = await getNpcCount(Promise.resolve({}));

    expect(result.total).toBe(40);
    expect(result.filtered).toBe(4);
    expect(result.totalPages).toBeGreaterThan(0);
    expect(result.filteredPages).toBeGreaterThan(0);
  });
});

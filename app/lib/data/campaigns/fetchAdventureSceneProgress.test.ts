import { describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const groupBy = vi.fn();
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { scene: { groupBy } },
}));

describe("fetchAdventureSceneProgress (SPEC-013 T7)", () => {
  it("returns zeroed progress for every adventure without touching the database", async () => {
    const { default: fetchAdventureSceneProgress } =
      await import("./fetchAdventureSceneProgress");

    const progress = await fetchAdventureSceneProgress([]);

    expect(progress).toEqual({});
    expect(groupBy).not.toHaveBeenCalled();
  });

  it("zero-fills an adventure with no scenes", async () => {
    groupBy.mockResolvedValue([]);

    const { default: fetchAdventureSceneProgress } =
      await import("./fetchAdventureSceneProgress");

    const progress = await fetchAdventureSceneProgress([10]);

    expect(progress).toEqual({ 10: { total: 0, awarded: 0 } });
  });

  it("sums awarded and unawarded scenes into total/awarded per adventure", async () => {
    groupBy.mockResolvedValue([
      { adventureId: 10, awarded: true, _count: { _all: 3 } },
      { adventureId: 10, awarded: false, _count: { _all: 5 } },
      { adventureId: 11, awarded: false, _count: { _all: 2 } },
    ]);

    const { default: fetchAdventureSceneProgress } =
      await import("./fetchAdventureSceneProgress");

    const progress = await fetchAdventureSceneProgress([10, 11]);

    expect(progress).toEqual({
      10: { total: 8, awarded: 3 },
      11: { total: 2, awarded: 0 },
    });
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    groupBy.mockRejectedValue(new Error("connection lost"));

    const { default: fetchAdventureSceneProgress } =
      await import("./fetchAdventureSceneProgress");

    await expect(fetchAdventureSceneProgress([10])).rejects.toThrow(
      DatabaseError
    );
  });
});

import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";
import { humanCountFixture } from "@/app/lib/calendar/dateSystemFixtures";

const findFirst = vi.fn();
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dateSystem: { findFirst } },
}));

describe("fetchDefaultDateSystem (SPEC-014 T4)", () => {
  beforeEach(() => {
    findFirst.mockReset();
  });

  it("returns the default system", async () => {
    const humanDefault = { ...humanCountFixture, isDefault: true };
    findFirst.mockResolvedValue(humanDefault);

    const { default: fetchDefaultDateSystem } =
      await import("./fetchDefaultDateSystem");

    expect(await fetchDefaultDateSystem()).toEqual(humanDefault);
  });

  it("prefers the default row and falls back to the universal count", async () => {
    findFirst.mockResolvedValue(null);

    const { default: fetchDefaultDateSystem } =
      await import("./fetchDefaultDateSystem");

    expect(await fetchDefaultDateSystem()).toBeNull();
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { OR: [{ isDefault: true }, { isUniversal: true }] },
        orderBy: [{ isDefault: "desc" }, { id: "asc" }],
      })
    );
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findFirst.mockRejectedValue(new Error("relation does not exist"));

    const { default: fetchDefaultDateSystem } =
      await import("./fetchDefaultDateSystem");

    await expect(fetchDefaultDateSystem()).rejects.toThrow(DatabaseError);
  });
});

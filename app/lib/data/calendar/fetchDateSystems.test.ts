import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";
import {
  humanCountFixture,
  universalCountFixture,
} from "@/app/lib/calendar/dateSystemFixtures";

const findMany = vi.fn();
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dateSystem: { findMany } },
}));

describe("fetchDateSystems (SPEC-014 T4)", () => {
  beforeEach(() => {
    findMany.mockReset();
  });

  it("orders the universal count first, then the others by name", async () => {
    findMany.mockResolvedValue([universalCountFixture, humanCountFixture]);

    const { default: fetchDateSystems } = await import("./fetchDateSystems");

    expect(await fetchDateSystems()).toEqual([
      universalCountFixture,
      humanCountFixture,
    ]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        orderBy: [{ isUniversal: "desc" }, { name: "asc" }, { id: "asc" }],
      })
    );
  });

  it("selects no timestamps", async () => {
    findMany.mockResolvedValue([]);

    const { default: fetchDateSystems } = await import("./fetchDateSystems");
    await fetchDateSystems();

    const select = (findMany.mock.calls[0]?.[0] as { select: object }).select;
    expect(select).not.toHaveProperty("createdAt");
    expect(select).not.toHaveProperty("updatedAt");
    expect(select).toHaveProperty("monthNames", true);
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("relation does not exist"));

    const { default: fetchDateSystems } = await import("./fetchDateSystems");

    await expect(fetchDateSystems()).rejects.toThrow(DatabaseError);
  });
});

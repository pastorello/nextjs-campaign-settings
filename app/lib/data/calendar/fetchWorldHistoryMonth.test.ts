import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { calendarEvent: { findMany } },
}));

import fetchWorldHistoryMonth from "./fetchWorldHistoryMonth";

const noFilters = { place: null, npc: null, deity: null, faction: null };

describe("fetchWorldHistoryMonth (SPEC-014 T7)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads only the events that can fall in the month, earlier yearly ones included", async () => {
    findMany.mockResolvedValue([
      {
        id: 1,
        title: "Harvest festival",
        description: null,
        startDay: 40,
        startHour: null,
        endDay: null,
        endHour: null,
        repeatsYearly: true,
        zones: [{ id: 3, title: "Valdor" }],
        npcs: [],
        deities: [],
        factions: [],
      },
    ]);

    const events = await fetchWorldHistoryMonth(
      { ...noFilters, place: 3 },
      365 + 31,
      365 + 58
    );

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          campaignId: null,
          zones: { some: { id: 3 } },
          startDay: { lte: 423 },
          OR: [
            { repeatsYearly: true },
            { endDay: { gte: 396 } },
            { endDay: null, startDay: { gte: 396 } },
          ],
        },
      })
    );
    expect(events[0]?.zones).toEqual([{ id: 3, name: "Valdor" }]);
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("connection lost"));

    await expect(
      fetchWorldHistoryMonth(noFilters, 0, 30)
    ).rejects.toBeInstanceOf(DatabaseError);
  });
});

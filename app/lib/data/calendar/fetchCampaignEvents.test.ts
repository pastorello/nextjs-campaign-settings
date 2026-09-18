import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { calendarEvent: { findMany } },
}));

import fetchCampaignEvents from "./fetchCampaignEvents";

const row = {
  id: 1,
  title: "The cult raises the tower",
  description: null,
  startDay: 10,
  startHour: null,
  endDay: null,
  endHour: null,
  repeatsYearly: false,
};

describe("fetchCampaignEvents (SPEC-014 T6)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads the campaign's events in order of start, naming adventure and scene", async () => {
    findMany.mockResolvedValue([
      { ...row, adventure: { id: 10, title: "Into the Mire" }, scene: null },
    ]);

    const events = await fetchCampaignEvents(1);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { campaignId: 1 },
        orderBy: [
          { startDay: "asc" },
          { startHour: { sort: "asc", nulls: "first" } },
          { id: "asc" },
        ],
      })
    );
    expect(events).toEqual([
      { ...row, adventure: { id: 10, name: "Into the Mire" }, scene: null },
    ]);
  });

  it("filters by adventure when one is given", async () => {
    findMany.mockResolvedValue([]);

    await fetchCampaignEvents(1, 10);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { campaignId: 1, adventureId: 10 } })
    );
  });

  it("reads only a month's events, earlier yearly ones included, given a range (T7)", async () => {
    findMany.mockResolvedValue([]);

    await fetchCampaignEvents(1, null, { firstDay: 31, lastDay: 58 });

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          campaignId: 1,
          startDay: { lte: 58 },
          OR: [
            { repeatsYearly: true },
            { endDay: { gte: 31 } },
            { endDay: null, startDay: { gte: 31 } },
          ],
        },
      })
    );
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("connection lost"));

    await expect(fetchCampaignEvents(1)).rejects.toBeInstanceOf(DatabaseError);
  });
});

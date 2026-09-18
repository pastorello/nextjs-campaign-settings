import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { calendarEvent: { findMany } },
}));

import fetchWorldHistoryBetween from "./fetchWorldHistoryBetween";

describe("fetchWorldHistoryBetween (SPEC-014 T6)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads the campaign-less events overlapping the range", async () => {
    findMany.mockResolvedValue([]);

    await fetchWorldHistoryBetween(365, 729);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          campaignId: null,
          startDay: { lte: 729 },
          OR: [
            { endDay: { gte: 365 } },
            { endDay: null, startDay: { gte: 365 } },
          ],
        },
      })
    );
  });

  it("reads earlier yearly events too, for the month grid (T7)", async () => {
    findMany.mockResolvedValue([]);

    await fetchWorldHistoryBetween(365, 729, true);

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: {
          campaignId: null,
          startDay: { lte: 729 },
          OR: [
            { repeatsYearly: true },
            { endDay: { gte: 365 } },
            { endDay: null, startDay: { gte: 365 } },
          ],
        },
      })
    );
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("connection lost"));

    await expect(fetchWorldHistoryBetween(0, 364)).rejects.toBeInstanceOf(
      DatabaseError
    );
  });
});

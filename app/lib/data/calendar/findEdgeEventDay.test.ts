import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const { findFirst } = vi.hoisted(() => ({ findFirst: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { calendarEvent: { findFirst } },
}));

import findEdgeEventDay from "./findEdgeEventDay";

describe("findEdgeEventDay (SPEC-014 T7)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads the latest matching start day", async () => {
    findFirst.mockResolvedValue({ startDay: 2_106_100 });

    const day = await findEdgeEventDay({ campaignId: null }, "last");

    expect(day).toBe(2_106_100);
    expect(findFirst).toHaveBeenCalledWith({
      where: { campaignId: null },
      orderBy: { startDay: "desc" },
      select: { startDay: true },
    });
  });

  it("reads the earliest, and null when nothing matches", async () => {
    findFirst.mockResolvedValue(null);

    expect(await findEdgeEventDay({ campaignId: 1 }, "first")).toBeNull();
    expect(findFirst).toHaveBeenCalledWith(
      expect.objectContaining({ orderBy: { startDay: "asc" } })
    );
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findFirst.mockRejectedValue(new Error("connection lost"));

    await expect(
      findEdgeEventDay({ campaignId: null }, "last")
    ).rejects.toBeInstanceOf(DatabaseError);
  });
});

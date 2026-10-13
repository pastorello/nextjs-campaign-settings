import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { campaign: { findMany } },
}));

import fetchCampaigns from "./fetchCampaigns";

describe("fetchCampaigns (SPEC-032 T2)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns nothing on a system with no campaign", async () => {
    findMany.mockResolvedValue([]);

    expect(await fetchCampaigns("dnd5e")).toEqual([]);
  });

  it("reads only the given system's campaigns, oldest first", async () => {
    findMany.mockResolvedValue([]);

    await fetchCampaigns("daggerheart");

    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { system: "daggerheart" },
        orderBy: { id: "asc" },
      })
    );
  });

  it("maps each row to a card with its adventure count", async () => {
    findMany.mockResolvedValue([
      {
        id: 1,
        title: "Silver Coast",
        synopsis: "<p>Hi</p>",
        partySize: 5,
        _count: { adventures: 3 },
      },
      {
        id: 2,
        title: "Silver Coast",
        synopsis: null,
        partySize: 4,
        _count: { adventures: 0 },
      },
    ]);

    expect(await fetchCampaigns("dnd5e")).toEqual([
      {
        id: 1,
        title: "Silver Coast",
        synopsis: "<p>Hi</p>",
        partySize: 5,
        adventureCount: 3,
      },
      {
        id: 2,
        title: "Silver Coast",
        synopsis: null,
        partySize: 4,
        adventureCount: 0,
      },
    ]);
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("connection lost"));

    await expect(fetchCampaigns("dnd5e")).rejects.toThrow(DatabaseError);
  });
});

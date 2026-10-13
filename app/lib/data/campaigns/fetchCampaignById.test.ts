import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";
import AdventureStatus from "@/app/lib/definitions/enums/campaign/AdventureStatus";

interface FindUniqueArgs {
  where: { id: number };
  select: { adventures: { orderBy: { position: string } } };
}
const { findUnique } = vi.hoisted(() => ({
  findUnique: vi.fn<(args: FindUniqueArgs) => unknown>(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { campaign: { findUnique } },
}));

import fetchCampaignById from "./fetchCampaignById";

const adventureRow = {
  id: 10,
  campaignId: 1,
  position: 1,
  targetLevel: 3,
  title: "Into the Mire",
  synopsis: null,
  status: "active",
  xpTarget: null,
  currencyTarget: 500,
  currencyUnit: "silver",
  permanentItemTarget: null,
  consumableTarget: null,
};

const row = {
  id: 1,
  title: "The Silver Coast",
  synopsis: null,
  partySize: 5,
  currentDay: null,
  system: "dnd5e",
  adventures: [adventureRow],
};

describe("fetchCampaignById (SPEC-032 T2)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns null when no campaign has the id", async () => {
    findUnique.mockResolvedValue(null);

    expect(await fetchCampaignById(99)).toBeNull();
    expect(findUnique.mock.calls[0]?.[0].where).toEqual({ id: 99 });
  });

  it("returns the campaign with its adventures in position order", async () => {
    findUnique.mockResolvedValue(row);

    const result = await fetchCampaignById(1);

    expect(result?.title).toBe("The Silver Coast");
    expect(result?.adventures).toHaveLength(1);
    expect(result?.adventures[0]?.status).toBe(AdventureStatus.Active);
    expect(findUnique.mock.calls[0]?.[0].select.adventures.orderBy).toEqual({
      position: "asc",
    });
  });

  it("treats an unset budget target as no value, not zero", async () => {
    findUnique.mockResolvedValue({
      ...row,
      adventures: [{ ...adventureRow, currencyTarget: null }],
    });

    const result = await fetchCampaignById(1);

    expect(result?.adventures[0]?.xpTarget).toBeNull();
    expect(result?.adventures[0]?.currencyTarget).toBeNull();
  });

  // The page redirects on a system mismatch, so the read is not scoped.
  it("reports the campaign's own system, whichever system asks", async () => {
    findUnique.mockResolvedValue({ ...row, system: "daggerheart" });

    const result = await fetchCampaignById(1);

    expect(result?.system).toBe("daggerheart");
    expect(findUnique.mock.calls[0]?.[0].where).toEqual({ id: 1 });
  });

  it("reads the campaign's current day", async () => {
    findUnique.mockResolvedValue({ ...row, currentDay: 2_100_000 });

    expect((await fetchCampaignById(1))?.currentDay).toBe(2_100_000);
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findUnique.mockRejectedValue(new Error("connection lost"));

    await expect(fetchCampaignById(1)).rejects.toThrow(DatabaseError);
  });
});

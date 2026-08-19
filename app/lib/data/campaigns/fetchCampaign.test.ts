import { describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";
import AdventureStatus from "@/app/lib/definitions/enums/campaign/AdventureStatus";

const findFirst = vi.fn();
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { campaign: { findFirst } },
}));

describe("fetchCampaign (SPEC-013 T5)", () => {
  it("returns null on an empty install", async () => {
    findFirst.mockResolvedValue(null);

    const { default: fetchCampaign } = await import("./fetchCampaign");

    expect(await fetchCampaign()).toBeNull();
  });

  it("returns the campaign with its adventures in position order", async () => {
    findFirst.mockResolvedValue({
      id: 1,
      title: "The Silver Coast",
      synopsis: null,
      partySize: 5,
      adventures: [
        {
          id: 10,
          campaignId: 1,
          position: 1,
          targetLevel: 3,
          title: "Into the Mire",
          synopsis: null,
          timeline: null,
          status: "active",
          xpTarget: null,
          currencyTarget: 500,
          currencyUnit: "silver",
          permanentItemTarget: null,
          consumableTarget: null,
        },
      ],
    });

    const { default: fetchCampaign } = await import("./fetchCampaign");
    const result = await fetchCampaign();

    expect(result?.title).toBe("The Silver Coast");
    expect(result?.adventures).toHaveLength(1);
    expect(result?.adventures[0]?.status).toBe(AdventureStatus.Active);
  });

  it("treats an unset budget target as no value, not zero", async () => {
    findFirst.mockResolvedValue({
      id: 1,
      title: "The Silver Coast",
      synopsis: null,
      partySize: 5,
      adventures: [
        {
          id: 10,
          campaignId: 1,
          position: 1,
          targetLevel: 3,
          title: "Into the Mire",
          synopsis: null,
          timeline: null,
          status: "planned",
          xpTarget: null,
          currencyTarget: null,
          currencyUnit: null,
          permanentItemTarget: null,
          consumableTarget: null,
        },
      ],
    });

    const { default: fetchCampaign } = await import("./fetchCampaign");
    const result = await fetchCampaign();

    expect(result?.adventures[0]?.xpTarget).toBeNull();
    expect(result?.adventures[0]?.currencyTarget).toBeNull();
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findFirst.mockRejectedValue(new Error("connection lost"));

    const { default: fetchCampaign } = await import("./fetchCampaign");

    await expect(fetchCampaign()).rejects.toThrow(DatabaseError);
  });
});

import { describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const { findMany } = vi.hoisted(() => ({ findMany: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { scene: { findMany } },
}));

import fetchCampaignScenes from "./fetchCampaignScenes";

describe("fetchCampaignScenes (SPEC-014 T6)", () => {
  it("reads every scene of the campaign's adventures, in ladder then scene order", async () => {
    const scenes = [{ id: 100, title: "The fog", adventureId: 10 }];
    findMany.mockResolvedValue(scenes);

    expect(await fetchCampaignScenes(1)).toEqual(scenes);
    expect(findMany).toHaveBeenCalledWith({
      where: { adventure: { campaignId: 1 } },
      orderBy: [{ adventure: { position: "asc" } }, { position: "asc" }],
      select: { id: true, title: true, adventureId: true },
    });
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("connection lost"));

    await expect(fetchCampaignScenes(1)).rejects.toBeInstanceOf(DatabaseError);
  });
});

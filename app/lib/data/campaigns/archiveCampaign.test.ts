import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { ForbiddenError, UnauthorizedError } from "@/app/lib/auth/requireDm";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { campaign } = vi.hoisted(() => ({
  campaign: { count: vi.fn(), update: vi.fn(), updateMany: vi.fn() },
}));
vi.mock("@/app/lib/connections/prisma", () => ({ default: { campaign } }));

import archiveCampaign from "./archiveCampaign";
import restoreCampaign from "./restoreCampaign";

describe("archiveCampaign and restoreCampaign (SPEC-032 T4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "dm", role: "dm" },
    } as never);
    campaign.count.mockResolvedValue(1);
  });

  it.each([
    ["archiveCampaign", archiveCampaign],
    ["restoreCampaign", restoreCampaign],
  ])("%s refuses a player and a missing session", async (_, action) => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "p", role: "player" },
    } as never);
    await expect(action({ campaignId: 3 })).rejects.toBeInstanceOf(
      ForbiddenError
    );

    vi.mocked(auth).mockResolvedValue(null as never);
    await expect(action({ campaignId: 3 })).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(campaign.update).not.toHaveBeenCalled();
    expect(campaign.updateMany).not.toHaveBeenCalled();
  });

  it.each([
    ["archiveCampaign", archiveCampaign],
    ["restoreCampaign", restoreCampaign],
  ])("%s validates the id without reading", async (_, action) => {
    const result = await action({ campaignId: -1 });

    expect(result.ok).toBe(false);
    expect(campaign.count).not.toHaveBeenCalled();
  });

  it.each([
    ["archiveCampaign", archiveCampaign],
    ["restoreCampaign", restoreCampaign],
  ])("%s names a campaign that does not exist", async (_, action) => {
    campaign.count.mockResolvedValue(0);

    await expect(action({ campaignId: 99 })).resolves.toEqual({
      ok: false,
      errors: { campaignId: [{ key: "campaignNotFound" }] },
    });
  });

  it("archives by setting archivedAt, only on an active campaign, and deletes nothing", async () => {
    await expect(archiveCampaign({ campaignId: 3 })).resolves.toEqual({
      ok: true,
    });

    expect(campaign.updateMany).toHaveBeenCalledWith({
      where: { id: 3, archivedAt: null },
      data: { archivedAt: expect.any(Date) as Date },
    });
  });

  it("restores by clearing archivedAt and nothing else", async () => {
    await expect(restoreCampaign({ campaignId: 3 })).resolves.toEqual({
      ok: true,
    });

    expect(campaign.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { archivedAt: null },
    });
  });
});

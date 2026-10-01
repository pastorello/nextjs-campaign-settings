import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { ForbiddenError } from "@/app/lib/auth/requireDm";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { campaign, users } = vi.hoisted(() => ({
  campaign: { findUnique: vi.fn(), count: vi.fn(), update: vi.fn() },
  users: { findUnique: vi.fn(), findMany: vi.fn() },
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { campaign, users },
}));

import addCampaignMember from "./addCampaignMember";
import removeCampaignMember from "./removeCampaignMember";
import fetchCampaignPlayers from "./fetchCampaignPlayers";

const userId = "7f0c1a52-3a51-4f5e-9d8b-2d6f1f7e9a10";

describe("campaign membership (SPEC-022 T5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "dm", role: "dm" },
    } as never);
    campaign.findUnique.mockResolvedValue({ id: 3 });
    campaign.count.mockResolvedValue(1);
    users.findUnique.mockResolvedValue({ role: "player" });
  });

  it.each([
    ["addCampaignMember", () => addCampaignMember({ campaignId: 3, userId })],
    [
      "removeCampaignMember",
      () => removeCampaignMember({ campaignId: 3, userId }),
    ],
    ["fetchCampaignPlayers", () => fetchCampaignPlayers(3)],
  ])("%s is the DM's", async (_, call) => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "p", role: "player" },
    } as never);

    await expect(call()).rejects.toBeInstanceOf(ForbiddenError);
    expect(campaign.update).not.toHaveBeenCalled();
  });

  it("adds a player to the campaign", async () => {
    await expect(addCampaignMember({ campaignId: 3, userId })).resolves.toEqual(
      { ok: true }
    );
    expect(campaign.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { members: { connect: { id: userId } } },
    });
  });

  it("refuses a DM: a group is a campaign's players", async () => {
    users.findUnique.mockResolvedValue({ role: "dm" });

    await expect(addCampaignMember({ campaignId: 3, userId })).resolves.toEqual(
      { ok: false, errors: { userId: [{ key: "notAPlayer" }] } }
    );
    expect(campaign.update).not.toHaveBeenCalled();
  });

  it("names a missing campaign or account", async () => {
    campaign.findUnique.mockResolvedValue(null);
    await expect(addCampaignMember({ campaignId: 3, userId })).resolves.toEqual(
      { ok: false, errors: { campaignId: [{ key: "campaignNotFound" }] } }
    );

    campaign.findUnique.mockResolvedValue({ id: 3 });
    users.findUnique.mockResolvedValue(null);
    await expect(addCampaignMember({ campaignId: 3, userId })).resolves.toEqual(
      { ok: false, errors: { userId: [{ key: "accountNotFound" }] } }
    );
  });

  it("refuses a malformed account id", async () => {
    const result = await addCampaignMember({ campaignId: 3, userId: "x" });

    expect(result.ok).toBe(false);
    expect(campaign.update).not.toHaveBeenCalled();
  });

  it("removes a player from the campaign", async () => {
    await expect(
      removeCampaignMember({ campaignId: 3, userId })
    ).resolves.toEqual({ ok: true });
    expect(campaign.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { members: { disconnect: { id: userId } } },
    });
  });

  it("names a missing campaign when removing", async () => {
    campaign.count.mockResolvedValue(0);

    await expect(
      removeCampaignMember({ campaignId: 3, userId })
    ).resolves.toEqual({
      ok: false,
      errors: { campaignId: [{ key: "campaignNotFound" }] },
    });
  });

  it("splits player accounts into the campaign's members and candidates", async () => {
    users.findMany.mockResolvedValue([
      {
        id: "a",
        name: "Ada",
        email: "ada@x.test",
        active: true,
        campaigns: [{ id: 3 }],
      },
      { id: "b", name: "Bo", email: "bo@x.test", active: true, campaigns: [] },
    ]);

    await expect(fetchCampaignPlayers(3)).resolves.toEqual({
      members: [{ id: "a", name: "Ada", email: "ada@x.test", active: true }],
      candidates: [{ id: "b", name: "Bo" }],
    });
    expect(users.findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { role: "player" } })
    );
  });
});

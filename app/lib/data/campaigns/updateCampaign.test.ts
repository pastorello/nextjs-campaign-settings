import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import Campaign from "@/app/lib/definitions/interfaces/campaign/Campaign";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { update } = vi.hoisted(() => ({ update: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { campaign: { update } },
}));

import updateCampaign from "./updateCampaign";

const validFormData: Omit<Campaign, "system"> = {
  id: 1,
  title: "The Black Hand Rises",
  synopsis: "A shadow falls over the free cities.",
  partySize: 5,
};

describe("updateCampaign (SPEC-013 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(updateCampaign(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(update).not.toHaveBeenCalled();
  });

  it("updates the campaign on valid input", async () => {
    update.mockResolvedValue({});

    const result = await updateCampaign(validFormData);

    const { id, ...rest } = validFormData;
    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id },
      data: rest,
    });
  });

  // SPEC-018 (decided 2026-09-11): a campaign does not switch systems. A
  // `system` smuggled into the payload is stripped, never written.
  it("never writes a submitted system", async () => {
    update.mockResolvedValue({});
    const payload = { ...validFormData, system: "pf2e" };

    const result = await updateCampaign(payload);

    expect(result).toEqual({ ok: true });
    expect(update).toHaveBeenCalledWith({
      where: { id: validFormData.id },
      data: {
        title: validFormData.title,
        synopsis: validFormData.synopsis,
        partySize: validFormData.partySize,
      },
    });
  });

  it("rejects a non-positive id, without writing", async () => {
    const result = await updateCampaign({ ...validFormData, id: -1 });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });

  it("rejects a non-positive party size, without writing", async () => {
    const result = await updateCampaign({ ...validFormData, partySize: -3 });

    expect(result.ok).toBe(false);
    expect(update).not.toHaveBeenCalled();
  });
});

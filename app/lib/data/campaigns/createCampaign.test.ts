import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import DatabaseError from "@/app/lib/errors/DatabaseError";
import Campaign from "@/app/lib/definitions/interfaces/campaign/Campaign";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { campaign: { create } },
}));

import createCampaign from "./createCampaign";

const validFormData: Campaign = {
  id: 0,
  title: "The Black Hand Rises",
  synopsis: "A shadow falls over the free cities.",
  partySize: 5,
  system: "dnd5e",
};

describe("createCampaign (SPEC-013 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createCampaign(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the campaign on valid input", async () => {
    create.mockResolvedValue({});

    const result = await createCampaign(validFormData);

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: {
        title: validFormData.title,
        synopsis: validFormData.synopsis,
        partySize: validFormData.partySize,
        system: "dnd5e",
      },
    });
  });

  // SPEC-018 T3: the system is asked for, and only a known one is accepted.
  it("rejects an unknown system, with a field error and without writing", async () => {
    const result = await createCampaign({
      ...validFormData,
      system: "pf2e" as Campaign["system"],
    });

    expect(result.ok).toBe(false);
    expect(result.ok === false && result.errors).toHaveProperty("system");
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a missing system, without writing", async () => {
    const withoutSystem: Partial<Campaign> = { ...validFormData };
    delete withoutSystem.system;

    const result = await createCampaign(withoutSystem as Campaign);

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a blank title, without writing", async () => {
    const result = await createCampaign({ ...validFormData, title: "" });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a non-positive party size, without writing", async () => {
    const result = await createCampaign({ ...validFormData, partySize: 0 });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  // TD-126: a failed write surfaces as a DatabaseError, not a raw Prisma one.
  it("wraps a write failure in a DatabaseError", async () => {
    create.mockRejectedValue(new Error("connection lost"));

    await expect(createCampaign(validFormData)).rejects.toBeInstanceOf(
      DatabaseError
    );
  });
});

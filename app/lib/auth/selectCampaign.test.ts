import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireDm";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
const { findFirst, set } = vi.hoisted(() => ({
  findFirst: vi.fn(),
  set: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { campaign: { findFirst } },
}));
vi.mock("next/headers", () => ({
  cookies: () => Promise.resolve({ set }),
}));

import selectCampaign from "./selectCampaign";

describe("selectCampaign (SPEC-022 §9)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "p", role: "player" },
    } as never);
  });

  it("refuses a request without a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(selectCampaign({ campaignId: 1 })).rejects.toBeInstanceOf(
      UnauthorizedError
    );
  });

  it("remembers a campaign the player is in, and names its system", async () => {
    findFirst.mockResolvedValue({ system: "daggerheart" });

    await expect(selectCampaign({ campaignId: 2 })).resolves.toEqual({
      ok: true,
      system: "daggerheart",
    });
    expect(findFirst).toHaveBeenCalledWith({
      where: { id: 2, members: { some: { id: "p" } } },
      select: { system: true },
    });
    expect(set).toHaveBeenCalledWith(
      "campaign",
      "2",
      expect.objectContaining({ httpOnly: true })
    );
  });

  it("writes nothing for a campaign the player is not in", async () => {
    findFirst.mockResolvedValue(null);

    await expect(selectCampaign({ campaignId: 9 })).resolves.toEqual({
      ok: false,
    });
    expect(set).not.toHaveBeenCalled();
  });

  it("refuses a malformed id without a query", async () => {
    await expect(selectCampaign({ campaignId: -1 })).resolves.toEqual({
      ok: false,
    });
    expect(findFirst).not.toHaveBeenCalled();
  });
});

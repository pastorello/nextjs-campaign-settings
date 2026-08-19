import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";
import Adventure from "@/app/lib/definitions/interfaces/campaign/Adventure";
import AdventureStatus from "@/app/lib/definitions/enums/campaign/AdventureStatus";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { adventure: { create } },
}));

import createAdventure from "./createAdventure";

const validFormData: Adventure = {
  id: 0,
  campaignId: 1,
  position: 1,
  targetLevel: 3,
  title: "Into the Kang Wilds",
  synopsis: "The party crosses the border.",
  timeline: "Early spring",
  status: AdventureStatus.Planned,
  xpTarget: 1000,
  currencyTarget: 500,
  currencyUnit: "silver",
  permanentItemTarget: 2,
  consumableTarget: 4,
};

describe("createAdventure (SPEC-013 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(createAdventure(validFormData)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(create).not.toHaveBeenCalled();
  });

  it("creates the adventure on valid input", async () => {
    create.mockResolvedValue({});

    const result = await createAdventure(validFormData);

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: {
        campaignId: 1,
        position: 1,
        targetLevel: 3,
        title: "Into the Kang Wilds",
        synopsis: "The party crosses the border.",
        timeline: "Early spring",
        status: AdventureStatus.Planned,
        xpTarget: 1000,
        currencyTarget: 500,
        currencyUnit: "silver",
        permanentItemTarget: 2,
        consumableTarget: 4,
      },
    });
  });

  it("creates a standalone adventure with no campaign", async () => {
    create.mockResolvedValue({});

    const result = await createAdventure({
      ...validFormData,
      campaignId: null,
    });

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: {
        campaignId: null,
        position: 1,
        targetLevel: 3,
        title: "Into the Kang Wilds",
        synopsis: "The party crosses the border.",
        timeline: "Early spring",
        status: AdventureStatus.Planned,
        xpTarget: 1000,
        currencyTarget: 500,
        currencyUnit: "silver",
        permanentItemTarget: 2,
        consumableTarget: 4,
      },
    });
  });

  it("rejects a blank title, without writing", async () => {
    const result = await createAdventure({ ...validFormData, title: "" });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("rejects a target level outside 1-20, without writing", async () => {
    const result = await createAdventure({ ...validFormData, targetLevel: 25 });

    expect(result.ok).toBe(false);
    expect(create).not.toHaveBeenCalled();
  });

  it("leaves an unset xpTarget as null rather than zero", async () => {
    create.mockResolvedValue({});

    const result = await createAdventure({ ...validFormData, xpTarget: null });

    expect(result).toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: {
        campaignId: 1,
        position: 1,
        targetLevel: 3,
        title: "Into the Kang Wilds",
        synopsis: "The party crosses the border.",
        timeline: "Early spring",
        status: AdventureStatus.Planned,
        xpTarget: null,
        currencyTarget: 500,
        currencyUnit: "silver",
        permanentItemTarget: 2,
        consumableTarget: 4,
      },
    });
  });
});

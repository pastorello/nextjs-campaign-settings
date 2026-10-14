import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { ForbiddenError, UnauthorizedError } from "@/app/lib/auth/requireDm";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));
vi.mock("next-intl/server", () => ({
  getTranslations: () =>
    Promise.resolve((key: string, values?: { title: string }) =>
      key === "titlePrefix" ? `Copia di ${values?.title}` : key
    ),
}));

interface CreateArgs {
  data: {
    title: string;
    scenes: { create: Array<{ awarded: boolean }> };
    [key: string]: unknown;
  };
}

const { tx, prisma } = vi.hoisted(() => {
  const tx = {
    adventure: {
      findUnique: vi.fn(),
      aggregate: vi.fn(),
      create: vi.fn<(args: CreateArgs) => unknown>(),
      update: vi.fn(),
      updateMany: vi.fn(),
      delete: vi.fn(),
    },
    campaign: { findUnique: vi.fn(), findFirst: vi.fn() },
    calendarEvent: {
      createMany:
        vi.fn<(args: { data: Array<Record<string, unknown>> }) => unknown>(),
      update: vi.fn(),
      delete: vi.fn(),
    },
  };
  const prisma = {
    $transaction: vi.fn((cb: (t: typeof tx) => unknown, _options?: unknown) =>
      Promise.resolve(cb(tx))
    ),
  };
  return { tx, prisma };
});
vi.mock("@/app/lib/connections/prisma", () => ({ default: prisma }));

import copyAdventure from "./copyAdventure";

const original = {
  id: 7,
  campaignId: 1,
  title: "Vault",
  synopsis: null,
  targetLevel: 3,
  status: "completed",
  xpTarget: null,
  currencyTarget: null,
  currencyUnit: null,
  permanentItemTarget: null,
  consumableTarget: null,
  goldTarget: null,
  scenes: [
    {
      id: 20,
      position: 1,
      kind: "fight",
      title: "First",
      description: null,
      xpAward: null,
      grantsHeroPoint: false,
      awarded: true,
      milestone: false,
      battleAdjustments: [],
      zoneId: null,
      creatures: [],
      loot: [],
    },
    {
      id: 21,
      position: 2,
      kind: "explore",
      title: "Second",
      description: null,
      xpAward: null,
      grantsHeroPoint: false,
      awarded: true,
      milestone: false,
      battleAdjustments: [],
      zoneId: null,
      creatures: [],
      loot: [],
    },
  ],
  calendarEvents: [
    {
      id: 51,
      title: "Descent",
      description: null,
      startDay: 10,
      startHour: null,
      endDay: null,
      endHour: null,
      repeatsYearly: false,
      campaignId: 1,
      adventureId: 7,
      sceneId: 21,
    },
  ],
};

describe("copyAdventure (SPEC-032 T5)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "dm", role: "dm" },
    } as never);
    tx.adventure.findUnique.mockResolvedValue(original);
    tx.campaign.findUnique.mockResolvedValue({ system: "dnd5e" });
    tx.campaign.findFirst.mockResolvedValue({ system: "dnd5e" });
    tx.adventure.aggregate.mockResolvedValue({ _max: { position: 4 } });
    tx.adventure.create.mockResolvedValue({
      id: 99,
      scenes: [{ id: 200 }, { id: 201 }],
    });
  });

  it("refuses a player and a missing session", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "p", role: "player" },
    } as never);
    await expect(
      copyAdventure({ adventureId: 7, destinationCampaignId: 2 })
    ).rejects.toBeInstanceOf(ForbiddenError);

    vi.mocked(auth).mockResolvedValue(null as never);
    await expect(
      copyAdventure({ adventureId: 7, destinationCampaignId: 2 })
    ).rejects.toBeInstanceOf(UnauthorizedError);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("validates the ids before opening a transaction", async () => {
    const result = await copyAdventure({
      adventureId: -1,
      destinationCampaignId: 0,
    });

    expect(result.ok).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("appends a reset copy to the destination and repoints the events", async () => {
    const result = await copyAdventure({
      adventureId: 7,
      destinationCampaignId: 2,
    });

    expect(result).toEqual({ ok: true, id: 99 });
    const data = tx.adventure.create.mock.calls[0]![0].data;
    expect(data).toMatchObject({
      campaignId: 2,
      position: 5,
      status: "planned",
      title: "Vault",
    });
    expect(data.scenes.create.map((scene) => scene.awarded)).toEqual([
      false,
      false,
    ]);
    expect(tx.calendarEvent.createMany.mock.calls[0]![0].data).toEqual([
      expect.objectContaining({
        campaignId: 2,
        adventureId: 99,
        // Scene 21 was the second one: the copy's second scene.
        sceneId: 201,
        startDay: 10,
      }),
    ]);
  });

  it("prefixes the title only when copied within its own campaign", async () => {
    await copyAdventure({ adventureId: 7, destinationCampaignId: 1 });

    expect(tx.adventure.create.mock.calls[0]![0].data.title).toBe(
      "Copia di Vault"
    );
  });

  it("reads the destination through activeCampaigns", async () => {
    tx.campaign.findFirst.mockResolvedValue(null);

    const result = await copyAdventure({
      adventureId: 7,
      destinationCampaignId: 2,
    });

    expect(tx.campaign.findFirst).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { id: 2, archivedAt: null },
      })
    );
    expect(result.ok).toBe(false);
    expect(tx.adventure.create).not.toHaveBeenCalled();
  });

  it("refuses a destination of another rules system", async () => {
    tx.campaign.findFirst.mockResolvedValue({ system: "daggerheart" });

    const result = await copyAdventure({
      adventureId: 7,
      destinationCampaignId: 2,
    });

    expect(result.ok).toBe(false);
    expect(tx.adventure.create).not.toHaveBeenCalled();
    expect(tx.calendarEvent.createMany).not.toHaveBeenCalled();
  });

  it("refuses a Daggerheart adventure going standalone", async () => {
    tx.campaign.findUnique.mockResolvedValue({ system: "daggerheart" });

    const result = await copyAdventure({
      adventureId: 7,
      destinationCampaignId: null,
    });

    expect(result.ok).toBe(false);
    expect(tx.adventure.create).not.toHaveBeenCalled();
  });

  it("names an adventure that does not exist", async () => {
    tx.adventure.findUnique.mockResolvedValue(null);

    const result = await copyAdventure({
      adventureId: 7,
      destinationCampaignId: 2,
    });

    expect(result.ok).toBe(false);
  });

  it("leaves the original untouched and sets an explicit timeout", async () => {
    await copyAdventure({ adventureId: 7, destinationCampaignId: 2 });

    expect(tx.adventure.update).not.toHaveBeenCalled();
    expect(tx.adventure.updateMany).not.toHaveBeenCalled();
    expect(tx.adventure.delete).not.toHaveBeenCalled();
    expect(tx.calendarEvent.update).not.toHaveBeenCalled();
    expect(tx.calendarEvent.delete).not.toHaveBeenCalled();
    const options = prisma.$transaction.mock.calls[0]![1] as {
      isolationLevel: string;
      timeout: number;
    };
    expect(options.isolationLevel).toBe("RepeatableRead");
    expect(options.timeout).toBeGreaterThan(5000);
  });
});

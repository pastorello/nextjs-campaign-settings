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

interface AdventureCreateArgs {
  data: {
    title: string;
    campaignId: number;
    position: number;
    status: string;
    scenes: { create: Array<{ awarded: boolean }> };
  };
}

const { tx, prisma } = vi.hoisted(() => {
  const tx = {
    campaign: {
      findUnique: vi.fn(),
      create: vi.fn<(args: { data: Record<string, unknown> }) => unknown>(),
      update: vi.fn(),
      updateMany: vi.fn(),
    },
    adventure: {
      create: vi.fn<(args: AdventureCreateArgs) => unknown>(),
      update: vi.fn(),
      delete: vi.fn(),
    },
    calendarEvent: {
      createMany:
        vi.fn<(args: { data: Array<Record<string, unknown>> }) => unknown>(),
      update: vi.fn(),
      updateMany: vi.fn(),
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

import copyCampaign from "./copyCampaign";

function adventure(id: number, position: number, sceneId: number) {
  return {
    id,
    campaignId: 1,
    position,
    title: `Adventure ${id}`,
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
        id: sceneId,
        position: 1,
        kind: "fight",
        title: "Scene",
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
        id: id * 10,
        title: `Event of ${id}`,
        description: null,
        startDay: id,
        startHour: null,
        endDay: null,
        endHour: null,
        repeatsYearly: false,
        campaignId: 1,
        adventureId: id,
        sceneId,
      },
    ],
  };
}

const source = {
  id: 1,
  title: "Curse",
  synopsis: "A long winter",
  partySize: 5,
  system: "dnd5e",
  currentDay: 400,
  archivedAt: new Date("2026-09-01"),
  // Out of ladder order on purpose: the query orders, the mock returns as given.
  adventures: [adventure(7, 1, 20), adventure(8, 2, 30)],
};

describe("copyCampaign (SPEC-032 T6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "dm", role: "dm" },
    } as never);
    tx.campaign.findUnique.mockResolvedValue(source);
    tx.campaign.create.mockResolvedValue({ id: 50 });
    let next = 100;
    tx.adventure.create.mockImplementation(() => {
      next += 1;
      return { id: next, scenes: [{ id: next * 10 }] };
    });
  });

  it("refuses a player and a missing session", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "p", role: "player" },
    } as never);
    await expect(copyCampaign({ campaignId: 1 })).rejects.toBeInstanceOf(
      ForbiddenError
    );

    vi.mocked(auth).mockResolvedValue(null as never);
    await expect(copyCampaign({ campaignId: 1 })).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("validates the id before opening a transaction", async () => {
    const result = await copyCampaign({ campaignId: -1 });

    expect(result.ok).toBe(false);
    expect(prisma.$transaction).not.toHaveBeenCalled();
  });

  it("names a campaign that does not exist", async () => {
    tx.campaign.findUnique.mockResolvedValue(null);

    const result = await copyCampaign({ campaignId: 1 });

    expect(result.ok).toBe(false);
    expect(tx.campaign.create).not.toHaveBeenCalled();
  });

  it("makes an active campaign with no members, reveals or current day", async () => {
    const result = await copyCampaign({ campaignId: 1 });

    expect(result).toEqual({ ok: true, id: 50 });
    // Only these four columns are written: a column left out takes its
    // default (`currentDay` and `archivedAt` null) and no relation is created.
    expect(tx.campaign.create.mock.calls[0]![0].data).toEqual({
      title: "Copia di Curse",
      synopsis: "A long winter",
      partySize: 5,
      system: "dnd5e",
    });
  });

  it("copies every adventure in ladder order, reset, into the new campaign", async () => {
    await copyCampaign({ campaignId: 1 });

    const data = tx.adventure.create.mock.calls.map(([args]) => args.data);
    expect(data).toHaveLength(2);
    expect(data.map((d) => d.title)).toEqual(["Adventure 7", "Adventure 8"]);
    expect(data.map((d) => d.position)).toEqual([1, 2]);
    expect(data.every((d) => d.campaignId === 50)).toBe(true);
    expect(data.every((d) => d.status === "planned")).toBe(true);
    expect(data[0]!.scenes.create[0]!.awarded).toBe(false);
  });

  it("carries each adventure's events with it and touches no other event", async () => {
    await copyCampaign({ campaignId: 1 });

    const written = tx.calendarEvent.createMany.mock.calls.flatMap(
      ([args]) => args.data
    );
    expect(written).toEqual([
      expect.objectContaining({
        title: "Event of 7",
        campaignId: 50,
        adventureId: 101,
        sceneId: 1010,
      }),
      expect.objectContaining({
        title: "Event of 8",
        campaignId: 50,
        adventureId: 102,
        sceneId: 1020,
      }),
    ]);
    expect(tx.calendarEvent.update).not.toHaveBeenCalled();
    expect(tx.calendarEvent.updateMany).not.toHaveBeenCalled();
    expect(tx.calendarEvent.delete).not.toHaveBeenCalled();
  });

  it("is all or nothing: a failure part-way rejects the transaction", async () => {
    tx.adventure.create
      .mockImplementationOnce(() => ({ id: 101, scenes: [{ id: 1010 }] }))
      .mockImplementationOnce(() => {
        throw new Error("write failed");
      });

    await expect(copyCampaign({ campaignId: 1 })).rejects.toThrow();
    // The error leaves the interactive callback, which is what makes Prisma
    // roll the transaction back; nothing runs outside it.
    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });

  it("leaves the original untouched and sets an explicit timeout", async () => {
    await copyCampaign({ campaignId: 1 });

    expect(tx.campaign.update).not.toHaveBeenCalled();
    expect(tx.campaign.updateMany).not.toHaveBeenCalled();
    expect(tx.adventure.update).not.toHaveBeenCalled();
    expect(tx.adventure.delete).not.toHaveBeenCalled();
    const options = prisma.$transaction.mock.calls[0]![1] as {
      isolationLevel: string;
      timeout: number;
    };
    expect(options.isolationLevel).toBe("RepeatableRead");
    expect(options.timeout).toBeGreaterThan(30_000);
  });
});

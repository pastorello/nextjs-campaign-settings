import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { ForbiddenError } from "@/app/lib/auth/requireDm";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { db } = vi.hoisted(() => ({
  db: {
    zone: { count: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    poi: { count: vi.fn(), update: vi.fn(), findMany: vi.fn() },
    campaign: { count: vi.fn(), findMany: vi.fn() },
  },
}));
vi.mock("@/app/lib/connections/prisma", () => ({ default: db }));

import fetchPlaceReveals from "./fetchPlaceReveals";
import setPlaceReveal from "./setPlaceReveal";

describe("place reveals (SPEC-022 T6b)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({
      user: { id: "dm", role: "dm" },
    } as never);
    db.zone.count.mockResolvedValue(1);
    db.poi.count.mockResolvedValue(1);
    db.campaign.count.mockResolvedValue(1);
  });

  it.each([
    ["fetchPlaceReveals", () => fetchPlaceReveals({ kind: "zone", id: 1 })],
    [
      "setPlaceReveal",
      () =>
        setPlaceReveal({ kind: "zone", id: 1, campaignId: 2, revealed: true }),
    ],
  ])("%s is the DM's", async (_, call) => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "p", role: "player" },
    } as never);

    await expect(call()).rejects.toBeInstanceOf(ForbiddenError);
  });

  it("reveals a zone to a campaign", async () => {
    await expect(
      setPlaceReveal({ kind: "zone", id: 3, campaignId: 2, revealed: true })
    ).resolves.toEqual({ ok: true });
    expect(db.zone.update).toHaveBeenCalledWith({
      where: { id: 3 },
      data: { revealedTo: { connect: { id: 2 } } },
    });
  });

  it("hides a landmark from a campaign", async () => {
    await setPlaceReveal({
      kind: "poi",
      id: 10,
      campaignId: 2,
      revealed: false,
    });

    expect(db.poi.update).toHaveBeenCalledWith({
      where: { id: 10 },
      data: { revealedTo: { disconnect: { id: 2 } } },
    });
  });

  it("names a missing place or campaign, and writes nothing", async () => {
    db.poi.count.mockResolvedValue(0);
    await expect(
      setPlaceReveal({ kind: "poi", id: 10, campaignId: 2, revealed: true })
    ).resolves.toEqual({
      ok: false,
      errors: { id: [{ key: "landmarkNotFound" }] },
    });

    db.campaign.count.mockResolvedValue(0);
    db.zone.count.mockResolvedValue(1);
    await expect(
      setPlaceReveal({ kind: "zone", id: 3, campaignId: 9, revealed: true })
    ).resolves.toEqual({
      ok: false,
      errors: { campaignId: [{ key: "campaignNotFound" }] },
    });
    expect(db.zone.update).not.toHaveBeenCalled();
    expect(db.poi.update).not.toHaveBeenCalled();
  });

  it("lists every campaign with the place's reveal and what hides it", async () => {
    db.campaign.findMany.mockResolvedValue([
      { id: 1, title: "Ashes" },
      { id: 2, title: "Embers" },
    ]);
    db.zone.findMany.mockResolvedValue([
      { id: 1, parentId: null, title: "World", revealedTo: [{ id: 1 }] },
      {
        id: 2,
        parentId: 1,
        title: "Kingdom",
        revealedTo: [{ id: 1 }, { id: 2 }],
      },
    ]);
    db.poi.findMany.mockResolvedValue([]);

    await expect(fetchPlaceReveals({ kind: "zone", id: 2 })).resolves.toEqual({
      campaigns: [
        { id: 1, title: "Ashes", revealed: true, hiddenBy: null },
        { id: 2, title: "Embers", revealed: true, hiddenBy: "World" },
      ],
    });
  });

  it("is null for a place that does not exist", async () => {
    db.campaign.findMany.mockResolvedValue([]);
    db.zone.findMany.mockResolvedValue([]);
    db.poi.findMany.mockResolvedValue([]);

    await expect(
      fetchPlaceReveals({ kind: "poi", id: 404 })
    ).resolves.toBeNull();
  });
});

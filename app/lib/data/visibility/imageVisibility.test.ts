import { beforeEach, describe, expect, it, vi } from "vitest";

const { db } = vi.hoisted(() => {
  const finder = () => ({ findFirst: vi.fn(), findMany: vi.fn() });
  return {
    db: {
      zone: finder(),
      npc: finder(),
      deities: finder(),
      magicitems: finder(),
      faction: finder(),
      dhDomain: finder(),
      dhAncestry: finder(),
      dhCommunity: finder(),
      dhWeapon: finder(),
    },
  };
});
vi.mock("@/app/lib/connections/prisma", () => ({ default: db }));

import isMapImageVisible from "./isMapImageVisible";
import isRecordImageVisible from "./isRecordImageVisible";

const scope = {
  kind: "campaign" as const,
  campaignId: 4,
  zones: new Set([1]),
  pois: new Set<number>(),
};

describe("image visibility for a player (SPEC-022 T7, R11, R12)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const model of Object.values(db)) {
      model.findFirst.mockResolvedValue(null);
      model.findMany.mockResolvedValue([]);
    }
  });

  it("serves everything to the DM, without a query", async () => {
    await expect(isRecordImageVisible(9, { kind: "all" })).resolves.toBe(true);
    await expect(isMapImageVisible("k", { kind: "all" })).resolves.toBe(true);
    expect(db.zone.findFirst).not.toHaveBeenCalled();
  });

  it("serves a visible place's image, not a hidden one's", async () => {
    db.zone.findFirst.mockResolvedValue({ id: 1 });
    await expect(isRecordImageVisible(9, scope)).resolves.toBe(true);

    db.zone.findFirst.mockResolvedValue({ id: 2 });
    await expect(isRecordImageVisible(9, scope)).resolves.toBe(false);
  });

  it("asks for a revealed NPC, and serves its portrait", async () => {
    db.npc.findFirst.mockResolvedValue({ id: 3 });

    await expect(isRecordImageVisible(9, scope)).resolves.toBe(true);
    expect(db.npc.findFirst).toHaveBeenCalledWith({
      where: { imageId: 9, revealedTo: { some: { id: 4 } } },
      select: { id: true },
    });
  });

  it("serves a Daggerheart domain's emblem, a rules catalogue", async () => {
    db.dhDomain.findFirst.mockResolvedValue({ id: 2 });

    await expect(isRecordImageVisible(9, scope)).resolves.toBe(true);
  });

  // SPEC-027: the heritage catalogues are rules too, and SPEC-029's weapons.
  it.each(["dhAncestry", "dhCommunity", "dhWeapon"] as const)(
    "serves a %s's picture, a rules catalogue",
    async (model) => {
      db[model].findFirst.mockResolvedValue({ id: 3 });

      await expect(isRecordImageVisible(9, scope)).resolves.toBe(true);
    }
  );

  it("serves an image no visible record owns to no player", async () => {
    await expect(isRecordImageVisible(9, scope)).resolves.toBe(false);
  });

  it("serves a map only when a place using it is visible", async () => {
    db.zone.findMany.mockResolvedValue([{ id: 2 }, { id: 1 }]);
    await expect(isMapImageVisible("k", scope)).resolves.toBe(true);

    db.zone.findMany.mockResolvedValue([{ id: 2 }]);
    await expect(isMapImageVisible("k", scope)).resolves.toBe(false);
  });
});

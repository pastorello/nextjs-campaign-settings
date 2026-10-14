import { describe, expect, it } from "vitest";

import { Prisma } from "@/generated/prisma/client";

import buildAdventureCopy, {
  type AdventureCopySource,
} from "./buildAdventureCopy";

const at = new Date("2026-01-01T00:00:00Z");

function source(): AdventureCopySource {
  return {
    id: 7,
    campaignId: 1,
    position: 2,
    targetLevel: 3,
    title: "The Drowned Vault",
    synopsis: "A flooded crypt",
    status: "completed",
    xpTarget: 900,
    currencyTarget: 500,
    currencyUnit: "gold",
    permanentItemTarget: 1,
    consumableTarget: 2,
    goldTarget: 4,
    createdAt: at,
    updatedAt: at,
    scenes: [
      {
        id: 21,
        adventureId: 7,
        position: 2,
        kind: "explore",
        title: "Second",
        description: null,
        xpAward: null,
        grantsHeroPoint: false,
        awarded: true,
        milestone: true,
        battleAdjustments: [],
        zoneId: null,
        createdAt: at,
        updatedAt: at,
        creatures: [],
        loot: [],
      },
      {
        id: 20,
        adventureId: 7,
        position: 1,
        kind: "fight",
        title: "First",
        description: "Eels",
        xpAward: 100,
        grantsHeroPoint: true,
        awarded: true,
        milestone: true,
        battleAdjustments: ["terrain"],
        zoneId: 5,
        createdAt: at,
        updatedAt: at,
        creatures: [
          {
            id: 31,
            sceneId: 20,
            position: 1,
            name: "Eel",
            level: 2,
            xpEach: 50,
            quantity: 3,
            note: "lurks",
            awarded: true,
            npcId: 9,
            dhAdversaryId: 8,
            statsUrl: "https://example.com/eel",
            challengeRating: "1/2",
          },
        ],
        loot: [
          {
            id: 41,
            sceneId: 20,
            position: 1,
            description: "Pearl",
            quantity: 2,
            value: 40,
            taken: true,
            magicItemId: 11,
            treasureId: null,
            gold: 3,
            dhWeaponId: null,
            dhArmorId: null,
            dhLootId: 12,
          },
        ],
      },
    ],
    calendarEvents: [
      {
        id: 51,
        title: "Descent",
        description: "d",
        startDay: 100,
        startHour: 8,
        endDay: 102,
        endHour: 20,
        repeatsYearly: true,
        campaignId: 1,
        adventureId: 7,
        sceneId: 20,
        createdAt: at,
        updatedAt: at,
      },
    ],
  };
}

const target = { campaignId: 4, position: 6, title: "Copy" };

describe("buildAdventureCopy (SPEC-032 §5.4)", () => {
  it("is pure: same output for the same input, input untouched", () => {
    const input = source();
    const snapshot = structuredClone(input);

    const first = buildAdventureCopy(input, target);
    const second = buildAdventureCopy(input, target);

    expect(second).toEqual(first);
    expect(input).toEqual(snapshot);
  });

  it("accounts for every column of every copied table", () => {
    const copy = buildAdventureCopy(source(), target);
    // Columns the database assigns or the parent supplies, never copied.
    const stamps = ["createdAt", "updatedAt"];
    const keys = (row: object, owned: string[]) =>
      [...Object.keys(row), "id", ...owned].sort();

    const scene = copy.scenes[0]!;
    expect(keys(copy.adventure, stamps)).toEqual(
      Object.values(Prisma.AdventureScalarFieldEnum).sort()
    );
    expect(keys(scene.scene, ["adventureId", ...stamps])).toEqual(
      Object.values(Prisma.SceneScalarFieldEnum).sort()
    );
    expect(keys(scene.creatures[0]!, ["sceneId"])).toEqual(
      Object.values(Prisma.SceneCreatureScalarFieldEnum).sort()
    );
    expect(keys(scene.loot[0]!, ["sceneId"])).toEqual(
      Object.values(Prisma.LootScalarFieldEnum).sort()
    );
    const event = copy.events[0]!.event;
    expect(
      keys(event, ["campaignId", "adventureId", "sceneId", ...stamps])
    ).toEqual(Object.values(Prisma.CalendarEventScalarFieldEnum).sort());
  });

  it("copies the authored fields and links in position order", () => {
    const copy = buildAdventureCopy(source(), target);

    expect(copy.adventure).toMatchObject({
      campaignId: 4,
      position: 6,
      title: "Copy",
      targetLevel: 3,
      synopsis: "A flooded crypt",
      xpTarget: 900,
      goldTarget: 4,
    });
    expect(copy.scenes.map((s) => s.scene.title)).toEqual(["First", "Second"]);
    expect(copy.scenes[0]!.scene).toMatchObject({
      zoneId: 5,
      battleAdjustments: ["terrain"],
    });
    expect(copy.scenes[0]!.creatures[0]).toMatchObject({
      npcId: 9,
      dhAdversaryId: 8,
      challengeRating: "1/2",
      quantity: 3,
    });
    expect(copy.scenes[0]!.loot[0]).toMatchObject({
      magicItemId: 11,
      dhLootId: 12,
      value: 40,
    });
  });

  it("resets progress: planned, nothing awarded, taken or milestone", () => {
    const copy = buildAdventureCopy(source(), target);

    expect(copy.adventure.status).toBe("planned");
    for (const { scene, creatures, loot } of copy.scenes) {
      expect(scene.awarded).toBe(false);
      expect(scene.milestone).toBe(false);
      expect(creatures.every((c) => c.awarded === false)).toBe(true);
      expect(loot.every((l) => l.taken === false)).toBe(true);
    }
  });

  it("keeps an event's dates and points its scene link at the copy's index", () => {
    const { event, sceneIndex } = buildAdventureCopy(source(), target)
      .events[0]!;

    expect(event).toMatchObject({
      startDay: 100,
      startHour: 8,
      endDay: 102,
      endHour: 20,
      repeatsYearly: true,
    });
    // Scene 20 sorts first by position.
    expect(sceneIndex).toBe(0);
  });

  it("copies no events to a standalone destination or world history", () => {
    const input = source();
    expect(
      buildAdventureCopy(input, { ...target, campaignId: null }).events
    ).toEqual([]);

    input.calendarEvents[0]!.campaignId = null;
    expect(buildAdventureCopy(input, target).events).toEqual([]);
  });
});

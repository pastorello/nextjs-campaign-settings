import { describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const findMany = vi.fn();
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { scene: { findMany } },
}));

// The SPEC-030 loot columns, unset, as a 5e row reads them.
const noDaggerheart = {
  gold: null,
  dhWeaponId: null,
  dhArmorId: null,
  dhLootId: null,
  dhLoot: null,
};

describe("getBudgetTotals (SPEC-013 T5)", () => {
  it("returns all-zero totals for an adventure with no scenes", async () => {
    findMany.mockResolvedValue([]);

    const { default: getBudgetTotals } = await import("./getBudgetTotals");
    const totals = await getBudgetTotals(10);

    expect(totals).toEqual({
      xp: { assigned: 0, found: 0 },
      currency: { assigned: 0, found: 0 },
      gold: { assigned: 0, found: 0 },
      permanentItems: { assigned: 0, found: 0 },
      consumables: { assigned: 0, found: 0 },
      heroPoints: 0,
      milestones: { planned: 0, reached: 0 },
    });
  });

  // Mixes a magic item (permanent), a magic item (consumable), a loot row
  // with its own value, a loot row falling back to a catalogue treasure's
  // value, and an unlinked loot row with no value at all — the fixture
  // SPEC-013 T5's task line calls for: "magic, catalogue and unlinked loot".
  it("keeps the three disjoint inventories separate, per the counting rule", async () => {
    findMany.mockResolvedValue([
      {
        xpAward: 100,
        awarded: true,
        grantsHeroPoint: true,
        creatures: [{ xpEach: 50, quantity: 2, awarded: true }],
        loot: [
          // Permanent magic item, taken.
          {
            quantity: 1,
            value: null,
            taken: true,
            magicItemId: 1,
            magicitem: { consumable: false },
            treasure: null,
            ...noDaggerheart,
          },
          // Consumable magic item, not yet taken.
          {
            quantity: 3,
            value: null,
            taken: false,
            magicItemId: 2,
            magicitem: { consumable: true },
            treasure: null,
            ...noDaggerheart,
          },
          // Unlinked coin, its own value, taken.
          {
            quantity: 1,
            value: 50,
            taken: true,
            magicItemId: null,
            magicitem: null,
            treasure: null,
            ...noDaggerheart,
          },
          // Unlinked, value from the catalogue treasure it points at.
          {
            quantity: 2,
            value: null,
            taken: false,
            magicItemId: null,
            magicitem: null,
            treasure: { value: 20 },
            ...noDaggerheart,
          },
          // Unlinked, no value at all — a plot item; contributes to nothing.
          {
            quantity: 1,
            value: null,
            taken: false,
            magicItemId: null,
            magicitem: null,
            treasure: null,
            ...noDaggerheart,
          },
        ],
      },
      // A scene with nothing checked off yet.
      {
        xpAward: null,
        awarded: false,
        grantsHeroPoint: false,
        creatures: [],
        loot: [],
      },
    ]);

    const { default: getBudgetTotals } = await import("./getBudgetTotals");
    const totals = await getBudgetTotals(10);

    // xp: 100 (scene) + 50*2 (creatures) = 200, all awarded.
    expect(totals.xp).toEqual({ assigned: 200, found: 200 });

    // currency: 50 (own value) + 20*2 (catalogue) + 0 (unlinked, no value) = 90;
    // only the 50 row is taken.
    expect(totals.currency).toEqual({ assigned: 90, found: 50 });

    // permanent items: the one non-consumable magic item, taken.
    expect(totals.permanentItems).toEqual({ assigned: 1, found: 1 });

    // consumables: the one consumable magic item, not taken.
    expect(totals.consumables).toEqual({ assigned: 3, found: 0 });

    expect(totals.heroPoints).toBe(1);
  });

  it("does not count a magic item's worth toward currency", async () => {
    findMany.mockResolvedValue([
      {
        xpAward: null,
        awarded: false,
        grantsHeroPoint: false,
        creatures: [],
        loot: [
          {
            quantity: 1,
            value: 9999,
            taken: false,
            magicItemId: 1,
            magicitem: { consumable: false },
            treasure: null,
            ...noDaggerheart,
          },
        ],
      },
    ]);

    const { default: getBudgetTotals } = await import("./getBudgetTotals");
    const totals = await getBudgetTotals(10);

    expect(totals.currency).toEqual({ assigned: 0, found: 0 });
    expect(totals.permanentItems).toEqual({ assigned: 1, found: 0 });
  });

  it("counts planned and reached milestones (SPEC-030 T2)", async () => {
    const scene = (milestone: boolean, awarded: boolean) => ({
      xpAward: null,
      awarded,
      grantsHeroPoint: false,
      milestone,
      creatures: [],
      loot: [],
    });
    findMany.mockResolvedValue([
      scene(true, true),
      scene(true, false),
      scene(false, true),
    ]);

    const { default: getBudgetTotals } = await import("./getBudgetTotals");
    const totals = await getBudgetTotals(1);

    expect(totals.milestones).toEqual({ planned: 2, reached: 1 });
  });

  it("counts Daggerheart gold and equipment (SPEC-030 T4)", async () => {
    const lootRow = (row: Record<string, unknown>) => ({
      quantity: 1,
      value: null,
      taken: false,
      magicItemId: null,
      magicitem: null,
      treasure: null,
      ...noDaggerheart,
      ...row,
    });
    findMany.mockResolvedValue([
      {
        xpAward: null,
        awarded: false,
        grantsHeroPoint: false,
        milestone: false,
        creatures: [],
        loot: [
          // Gold alone, taken: 3 handfuls × 2.
          lootRow({ gold: 3, quantity: 2, taken: true }),
          // A weapon with gold beside it: an item, and its gold still counts.
          lootRow({ dhWeaponId: 1, gold: 10 }),
          // An armor, taken.
          lootRow({ dhArmorId: 4, taken: true }),
          // A consumable and an item from the loot catalogue.
          lootRow({
            dhLootId: 2,
            dhLoot: { lootKind: "consumable" },
            quantity: 3,
          }),
          lootRow({ dhLootId: 5, dhLoot: { lootKind: "item" } }),
        ],
      },
    ]);

    const { default: getBudgetTotals } = await import("./getBudgetTotals");
    const totals = await getBudgetTotals(1);

    expect(totals.gold).toEqual({ assigned: 16, found: 6 });
    expect(totals.permanentItems).toEqual({ assigned: 3, found: 1 });
    expect(totals.consumables).toEqual({ assigned: 3, found: 0 });
    expect(totals.currency).toEqual({ assigned: 0, found: 0 });
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("connection lost"));

    const { default: getBudgetTotals } = await import("./getBudgetTotals");

    await expect(getBudgetTotals(10)).rejects.toThrow(DatabaseError);
  });
});

import { describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";

const findMany = vi.fn();
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { scene: { findMany } },
}));

describe("getBudgetTotals (SPEC-013 T5)", () => {
  it("returns all-zero totals for an adventure with no scenes", async () => {
    findMany.mockResolvedValue([]);

    const { default: getBudgetTotals } = await import("./getBudgetTotals");
    const totals = await getBudgetTotals(10);

    expect(totals).toEqual({
      xp: { assigned: 0, found: 0 },
      currency: { assigned: 0, found: 0 },
      permanentItems: { assigned: 0, found: 0 },
      consumables: { assigned: 0, found: 0 },
      heroPoints: 0,
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
          },
          // Consumable magic item, not yet taken.
          {
            quantity: 3,
            value: null,
            taken: false,
            magicItemId: 2,
            magicitem: { consumable: true },
            treasure: null,
          },
          // Unlinked coin, its own value, taken.
          {
            quantity: 1,
            value: 50,
            taken: true,
            magicItemId: null,
            magicitem: null,
            treasure: null,
          },
          // Unlinked, value from the catalogue treasure it points at.
          {
            quantity: 2,
            value: null,
            taken: false,
            magicItemId: null,
            magicitem: null,
            treasure: { value: 20 },
          },
          // Unlinked, no value at all — a plot item; contributes to nothing.
          {
            quantity: 1,
            value: null,
            taken: false,
            magicItemId: null,
            magicitem: null,
            treasure: null,
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
          },
        ],
      },
    ]);

    const { default: getBudgetTotals } = await import("./getBudgetTotals");
    const totals = await getBudgetTotals(10);

    expect(totals.currency).toEqual({ assigned: 0, found: 0 });
    expect(totals.permanentItems).toEqual({ assigned: 1, found: 0 });
  });

  it("wraps a Prisma failure in a DatabaseError", async () => {
    findMany.mockRejectedValue(new Error("connection lost"));

    const { default: getBudgetTotals } = await import("./getBudgetTotals");

    await expect(getBudgetTotals(10)).rejects.toThrow(DatabaseError);
  });
});

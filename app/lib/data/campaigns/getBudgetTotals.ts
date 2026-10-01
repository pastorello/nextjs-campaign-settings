import prisma from "@/app/lib/connections/prisma";
import toDatabaseError from "@/app/lib/errors/toDatabaseError";
import DhLootKind from "@/app/lib/definitions/enums/daggerheart/DhLootKind";

export interface BudgetFigure {
  assigned: number;
  found: number;
}

export interface BudgetTotals {
  xp: BudgetFigure;
  currency: BudgetFigure;
  /** SPEC-030 T4: a Daggerheart adventure's gold, in handfuls. */
  gold: BudgetFigure;
  permanentItems: BudgetFigure;
  consumables: BudgetFigure;
  heroPoints: number;
  /**
   * SPEC-030: a Daggerheart adventure's milestones, planned (marked) and
   * reached (marked and played). Zero for a 5e one, which has none.
   */
  milestones: { planned: number; reached: number };
}

/**
 * The four budgets' assigned/found totals for one adventure, plus the
 * hero-point count — SPEC-013 §6, "Derived, never stored: every total in
 * the budget panel... and the hero-point count." Nothing here is persisted;
 * it is recomputed from the scene tree on every read.
 *
 * `currency`, `permanentItems` and `consumables` are the three disjoint
 * inventories the counting rule describes (§6): a loot row linked to a
 * magic item counts toward `permanentItems` or `consumables` by that item's
 * `consumable` flag, by quantity, and never toward `currency`; a loot row
 * not linked to one counts toward `currency` by `value × quantity` — its
 * own `value` if set, else the linked catalogue treasure's, else 0 (an
 * unlinked row with no value contributes 0, i.e. counts toward no total,
 * per §5's edge case) — and never toward the other two.
 *
 * Daggerheart's rows (SPEC-030 §9 decisions 6 and 7) follow the same
 * shape: a row linked to a weapon, an armor or an item counts toward
 * `permanentItems`, one linked to a consumable toward `consumables`, both
 * by quantity. Its `gold` counts toward `gold` by `gold × quantity` whatever
 * it links — unlike a magic item's `value`, which is the item's own worth,
 * gold is coin found beside it — and toward no item total.
 *
 * `assigned` sums every row regardless of its check state; `found` sums
 * only the checked ones (`scene.awarded`, `sceneCreature.awarded`,
 * `loot.taken`) — what the party actually got, versus what the DM placed.
 *
 * The hero-point count is the scenes that grant one AND have been
 * awarded — the running total earned so far. There is no
 * `heroPointTarget` column to compare a potential figure against, so
 * unlike the other four this is a single number, not an assigned/found
 * pair.
 */
export default async function getBudgetTotals(
  adventureId: number
): Promise<BudgetTotals> {
  let scenes;
  try {
    scenes = await prisma.scene.findMany({
      where: { adventureId },
      select: {
        xpAward: true,
        awarded: true,
        grantsHeroPoint: true,
        milestone: true,
        creatures: {
          select: { xpEach: true, quantity: true, awarded: true },
        },
        loot: {
          select: {
            quantity: true,
            value: true,
            taken: true,
            magicItemId: true,
            magicitem: { select: { consumable: true } },
            treasure: { select: { value: true } },
            gold: true,
            dhWeaponId: true,
            dhArmorId: true,
            dhLootId: true,
            dhLoot: { select: { lootKind: true } },
          },
        },
      },
    });
  } catch (error) {
    throw toDatabaseError("computing budget totals", error);
  }

  const totals: BudgetTotals = {
    xp: { assigned: 0, found: 0 },
    currency: { assigned: 0, found: 0 },
    gold: { assigned: 0, found: 0 },
    permanentItems: { assigned: 0, found: 0 },
    consumables: { assigned: 0, found: 0 },
    heroPoints: 0,
    milestones: { planned: 0, reached: 0 },
  };
  const count = (figure: BudgetFigure, amount: number, found: boolean) => {
    figure.assigned += amount;
    if (found) figure.found += amount;
  };

  for (const scene of scenes) {
    if (scene.milestone) {
      totals.milestones.planned += 1;
      if (scene.awarded) totals.milestones.reached += 1;
    }

    const sceneXp = scene.xpAward ?? 0;
    totals.xp.assigned += sceneXp;
    if (scene.awarded) {
      totals.xp.found += sceneXp;
      if (scene.grantsHeroPoint) totals.heroPoints += 1;
    }

    for (const creature of scene.creatures) {
      const creatureXp = (creature.xpEach ?? 0) * creature.quantity;
      totals.xp.assigned += creatureXp;
      if (creature.awarded) totals.xp.found += creatureXp;
    }

    for (const lootRow of scene.loot) {
      if (lootRow.gold !== null) {
        count(totals.gold, lootRow.gold * lootRow.quantity, lootRow.taken);
      }
      if (lootRow.dhWeaponId !== null || lootRow.dhArmorId !== null) {
        count(totals.permanentItems, lootRow.quantity, lootRow.taken);
        continue;
      }
      if (lootRow.dhLootId !== null) {
        const figure =
          lootRow.dhLoot?.lootKind === DhLootKind.Consumable
            ? totals.consumables
            : totals.permanentItems;
        count(figure, lootRow.quantity, lootRow.taken);
        continue;
      }

      if (lootRow.magicItemId !== null) {
        const figure = lootRow.magicitem?.consumable
          ? totals.consumables
          : totals.permanentItems;
        figure.assigned += lootRow.quantity;
        if (lootRow.taken) figure.found += lootRow.quantity;
        continue;
      }

      const value = lootRow.value ?? lootRow.treasure?.value ?? 0;
      const rowTotal = value * lootRow.quantity;
      totals.currency.assigned += rowTotal;
      if (lootRow.taken) totals.currency.found += rowTotal;
    }
  }

  return totals;
}

import { getTranslations } from "next-intl/server";

import { BudgetTotals } from "@/app/lib/data/campaigns/getBudgetTotals";
import {
  CurrencyUnit,
  toDisplayAmount,
} from "@/app/lib/utils/currency/convertCurrency";
import SectionTitle from "@/app/ui/typography/SectionTitle";
import { formatGold } from "@/app/lib/utils/daggerheart/gold";
import type GameSystem from "@/app/lib/definitions/GameSystem";

interface BudgetPanelProps {
  /**
   * SPEC-030: Daggerheart counts milestones and items, not XP, silver or
   * hero points.
   */
  rulesSystem?: GameSystem;
  totals: BudgetTotals;
  currencyUnit: CurrencyUnit;
  xpTarget: number | null;
  currencyTarget: number | null;
  permanentItemTarget: number | null;
  consumableTarget: number | null;
  /** SPEC-030 T4: a Daggerheart adventure's gold target, in handfuls. */
  goldTarget?: number | null;
}

/**
 * The adventure's budget panel (SPEC-013 §5.6, T9) — for each of
 * experience, currency, permanent items and consumables: target, assigned
 * and found (`getBudgetTotals`, T5), plus the two named differences — what
 * is left to place (`target - assigned`) and what the party missed
 * (`assigned - found`). An unset target reads "—", never 0 (§5's edge
 * case). Currency figures are converted to the adventure's display unit at
 * the render boundary; the stored value stays silver throughout
 * (`convertCurrency.ts`). A server component — `revalidatePath` in the
 * check-off actions plus the adventure page's `router.refresh()` are what
 * makes it update without a full page reload, not client state here.
 */
export default async function BudgetPanel({
  rulesSystem = "dnd5e",
  totals,
  currencyUnit,
  xpTarget,
  currencyTarget,
  permanentItemTarget,
  consumableTarget,
  goldTarget = null,
}: BudgetPanelProps) {
  const t = await getTranslations();
  const gold = (handfuls: number) =>
    formatGold(handfuls, (unit, count) =>
      t(`daggerheart.gold.${unit}`, { count })
    );

  const currencyDisplayTarget =
    currencyTarget === null
      ? null
      : toDisplayAmount(currencyTarget, currencyUnit);
  const currencyAssigned = toDisplayAmount(
    totals.currency.assigned,
    currencyUnit
  );
  const currencyFound = toDisplayAmount(totals.currency.found, currencyUnit);

  const isDaggerheart = rulesSystem === "daggerheart";
  const allRows = [
    {
      key: "xp",
      label: t("budget.categories.xp"),
      target: xpTarget,
      assigned: totals.xp.assigned,
      found: totals.xp.found,
    },
    {
      key: "currency",
      label: `${t("budget.categories.currency")} (${t(`adventure.currencyUnits.${currencyUnit}`)})`,
      target: currencyDisplayTarget,
      assigned: currencyAssigned,
      found: currencyFound,
    },
    {
      key: "gold",
      label: t("budget.categories.gold"),
      target: goldTarget,
      assigned: totals.gold.assigned,
      found: totals.gold.found,
      format: gold,
    },
    {
      key: "permanentItems",
      label: t("budget.categories.permanentItems"),
      target: permanentItemTarget,
      assigned: totals.permanentItems.assigned,
      found: totals.permanentItems.found,
    },
    {
      key: "consumables",
      label: t("budget.categories.consumables"),
      target: consumableTarget,
      assigned: totals.consumables.assigned,
      found: totals.consumables.found,
    },
  ];
  // Daggerheart has no XP and no silver, and 5e no handfuls (SPEC-030 §5).
  const notInSystem = isDaggerheart ? ["xp", "currency"] : ["gold"];
  const rows = allRows
    .filter((row) => !notInSystem.includes(row.key))
    .map(({ format = String, ...row }) => ({
      ...row,
      target: row.target === null ? "—" : format(row.target),
      assigned: format(row.assigned),
      remaining: row.target === null ? "—" : format(row.target - row.assigned),
      found: format(row.found),
      missed: format(row.assigned - row.found),
    }));

  return (
    <div className="mb-6 rounded-md border p-4">
      <SectionTitle className="mb-3">{t("budget.title")}</SectionTitle>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-left text-gray-600">
              <th className="pr-4 py-1 font-medium">
                {t("budget.columns.category")}
              </th>
              <th className="pr-4 py-1 font-medium">
                {t("budget.columns.target")}
              </th>
              <th className="pr-4 py-1 font-medium">
                {t("budget.columns.assigned")}
              </th>
              <th className="pr-4 py-1 font-medium">
                {t("budget.columns.remaining")}
              </th>
              <th className="pr-4 py-1 font-medium">
                {t("budget.columns.found")}
              </th>
              <th className="py-1 font-medium">{t("budget.columns.missed")}</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.key} className="border-t">
                <td className="py-1 pr-4">{row.label}</td>
                <td className="py-1 pr-4">{row.target}</td>
                <td className="py-1 pr-4">{row.assigned}</td>
                <td className="py-1 pr-4">{row.remaining}</td>
                <td className="py-1 pr-4">{row.found}</td>
                <td className="py-1">{row.missed}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {isDaggerheart ? (
        <p className="mt-3 text-sm text-gray-600">
          {t("budget.milestones.title")}: {t("budget.milestones.planned")}{" "}
          {totals.milestones.planned} · {t("budget.milestones.reached")}{" "}
          {totals.milestones.reached}
        </p>
      ) : (
        <p className="mt-3 text-sm text-gray-600">
          {t("budget.heroPoints")}: {totals.heroPoints}
        </p>
      )}
    </div>
  );
}

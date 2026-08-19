import { getTranslations } from "next-intl/server";

import { BudgetTotals } from "@/app/lib/data/campaigns/getBudgetTotals";
import {
  CurrencyUnit,
  toDisplayAmount,
} from "@/app/lib/utils/currency/convertCurrency";

interface BudgetPanelProps {
  totals: BudgetTotals;
  currencyUnit: CurrencyUnit;
  xpTarget: number | null;
  currencyTarget: number | null;
  permanentItemTarget: number | null;
  consumableTarget: number | null;
}

function formatFigure(value: number | null): string {
  return value === null ? "—" : String(value);
}

function remaining(target: number | null, assigned: number): string {
  return target === null ? "—" : String(target - assigned);
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
  totals,
  currencyUnit,
  xpTarget,
  currencyTarget,
  permanentItemTarget,
  consumableTarget,
}: BudgetPanelProps) {
  const t = await getTranslations();

  const currencyDisplayTarget =
    currencyTarget === null
      ? null
      : toDisplayAmount(currencyTarget, currencyUnit);
  const currencyAssigned = toDisplayAmount(
    totals.currency.assigned,
    currencyUnit
  );
  const currencyFound = toDisplayAmount(totals.currency.found, currencyUnit);

  const rows = [
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

  return (
    <div className="mb-6 rounded-md border p-4">
      <h2 className="mb-3 text-lg font-bold">{t("budget.title")}</h2>
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
                <td className="py-1 pr-4">{formatFigure(row.target)}</td>
                <td className="py-1 pr-4">{row.assigned}</td>
                <td className="py-1 pr-4">
                  {remaining(row.target, row.assigned)}
                </td>
                <td className="py-1 pr-4">{row.found}</td>
                <td className="py-1">{row.assigned - row.found}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-3 text-sm text-gray-600">
        {t("budget.heroPoints")}: {totals.heroPoints}
      </p>
    </div>
  );
}

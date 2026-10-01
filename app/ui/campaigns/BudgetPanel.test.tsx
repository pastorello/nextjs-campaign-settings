import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: (namespace?: string) =>
    Promise.resolve((key: string, values?: Record<string, unknown>) => {
      const full = namespace ? `${namespace}.${key}` : key;
      return values ? `${full} ${JSON.stringify(values)}` : full;
    }),
}));

import BudgetPanel from "./BudgetPanel";
import { BudgetTotals } from "@/app/lib/data/campaigns/getBudgetTotals";

function makeTotals(overrides: Partial<BudgetTotals> = {}): BudgetTotals {
  return {
    xp: { assigned: 0, found: 0 },
    currency: { assigned: 0, found: 0 },
    gold: { assigned: 0, found: 0 },
    permanentItems: { assigned: 0, found: 0 },
    consumables: { assigned: 0, found: 0 },
    heroPoints: 0,
    milestones: { planned: 0, reached: 0 },
    ...overrides,
  };
}

describe("BudgetPanel (SPEC-013 §5.6, T9)", () => {
  it("shows an unset target as '—', not 0", async () => {
    const ui = await BudgetPanel({
      totals: makeTotals(),
      currencyUnit: "silver",
      xpTarget: null,
      currencyTarget: null,
      permanentItemTarget: null,
      consumableTarget: null,
    });
    render(ui);

    const dashes = screen.getAllByText("—");
    // one per budget row's target cell (xp, currency, permanentItems, consumables)
    expect(dashes.length).toBeGreaterThanOrEqual(4);
  });

  it("shows target, assigned and found for a set budget", async () => {
    const ui = await BudgetPanel({
      totals: makeTotals({ xp: { assigned: 500, found: 200 } }),
      currencyUnit: "silver",
      xpTarget: 900,
      currencyTarget: null,
      permanentItemTarget: null,
      consumableTarget: null,
    });
    render(ui);

    expect(screen.getByText("900")).toBeInTheDocument();
    expect(screen.getByText("500")).toBeInTheDocument();
    expect(screen.getByText("200")).toBeInTheDocument();
  });

  it("converts currency figures to the adventure's display unit", async () => {
    const ui = await BudgetPanel({
      totals: makeTotals({ currency: { assigned: 300, found: 100 } }),
      currencyUnit: "gold",
      xpTarget: null,
      currencyTarget: 800,
      permanentItemTarget: null,
      consumableTarget: null,
    });
    render(ui);

    // 800 silver target -> 80 gold; 300 assigned -> 30 gold; 100 found -> 10 gold
    expect(screen.getByText("80")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    expect(screen.getByText("10")).toBeInTheDocument();
  });

  it("shows the hero-point count", async () => {
    const ui = await BudgetPanel({
      totals: makeTotals({ heroPoints: 3 }),
      currencyUnit: "silver",
      xpTarget: null,
      currencyTarget: null,
      permanentItemTarget: null,
      consumableTarget: null,
    });
    render(ui);

    expect(screen.getByText(/3/)).toBeInTheDocument();
  });

  // SPEC-030 T2: Daggerheart counts milestones, not XP, silver or hero points.
  it("shows a Daggerheart adventure's milestones and items only", async () => {
    const ui = await BudgetPanel({
      rulesSystem: "daggerheart",
      totals: makeTotals({ milestones: { planned: 3, reached: 1 } }),
      currencyUnit: "silver",
      xpTarget: null,
      currencyTarget: null,
      permanentItemTarget: null,
      consumableTarget: null,
    });
    render(ui);

    expect(screen.queryByText("budget.categories.xp")).toBeNull();
    expect(screen.queryByText(/budget\.categories\.currency/)).toBeNull();
    expect(screen.queryByText(/budget\.heroPoints/)).toBeNull();
    expect(
      screen.getByText("budget.categories.permanentItems")
    ).toBeInTheDocument();
    expect(screen.getByText(/budget\.milestones\.title/)).toHaveTextContent(
      "budget.milestones.planned 3 · budget.milestones.reached 1"
    );
  });

  // SPEC-030 T4: Daggerheart's gold, shown in denominations.
  it("shows a Daggerheart adventure's gold row, and a 5e one none", async () => {
    const props = {
      totals: makeTotals({ gold: { assigned: 30, found: 10 } }),
      currencyUnit: "silver" as const,
      xpTarget: null,
      currencyTarget: null,
      permanentItemTarget: null,
      consumableTarget: null,
      goldTarget: 100,
    };
    const { unmount } = render(
      await BudgetPanel({ ...props, rulesSystem: "daggerheart" })
    );

    const row = screen.getByText("budget.categories.gold").closest("tr");
    const cells = within(row!)
      .getAllByRole("cell")
      .map((c) => c.textContent);
    expect(cells).toEqual([
      "budget.categories.gold",
      'daggerheart.gold.chests {"count":1}',
      'daggerheart.gold.bags {"count":3}',
      'daggerheart.gold.bags {"count":7}',
      'daggerheart.gold.bags {"count":1}',
      'daggerheart.gold.bags {"count":2}',
    ]);
    unmount();

    render(await BudgetPanel(props));
    expect(screen.queryByText("budget.categories.gold")).toBeNull();
  });
});

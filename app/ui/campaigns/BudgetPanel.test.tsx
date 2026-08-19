import { render, screen } from "@testing-library/react";
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
    permanentItems: { assigned: 0, found: 0 },
    consumables: { assigned: 0, found: 0 },
    heroPoints: 0,
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
});

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { adventure, budgetTotals } from "@/.storybook/fixtures/campaigns";
import BudgetPanel from "./BudgetPanel";

/** An adventure's four budgets, assigned against target (SPEC-013 §5.2). */
const meta = {
  component: BudgetPanel,
  args: {
    totals: budgetTotals,
    currencyUnit: "silver",
    xpTarget: adventure.xpTarget,
    currencyTarget: adventure.currencyTarget,
    permanentItemTarget: adventure.permanentItemTarget,
    consumableTarget: adventure.consumableTarget,
  },
} satisfies Meta<typeof BudgetPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dnd5e: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("table")).toBeVisible();
    await expect(canvas.getByText("3000")).toBeVisible();
  },
};

export const NoTargets: Story = {
  args: {
    xpTarget: null,
    currencyTarget: null,
    permanentItemTarget: null,
    consumableTarget: null,
  },
  play: async ({ canvas }) => {
    await expect((await canvas.findAllByText("—")).length).toBeGreaterThan(0);
  },
};

export const Daggerheart: Story = {
  args: {
    rulesSystem: "daggerheart",
    goldTarget: 6,
    totals: {
      ...budgetTotals,
      gold: { assigned: 4, found: 2 },
      heroPoints: 2,
      milestones: { planned: 3, reached: 1 },
    },
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("table")).toBeVisible();
    await expect(canvas.getByText(/Traguardi: Pianificati 3/)).toBeVisible();
  },
};

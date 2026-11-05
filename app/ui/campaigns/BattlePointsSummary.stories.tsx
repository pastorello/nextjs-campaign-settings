import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import BattlePointsSummary from "./BattlePointsSummary";

const row = (adversaryType: string, tier: number, quantity = 1) => ({
  quantity,
  dhAdversary: { adversaryType, tier },
});

/** A Daggerheart fight's Battle Points against its budget (SPEC-030 §5). */
const meta = {
  component: BattlePointsSummary,
  args: {
    creatures: [row("standard", 2, 2), row("leader", 2)],
    partySize: 4,
    adventureTier: 2,
    adjustments: [],
  },
} satisfies Meta<typeof BattlePointsSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Punti Battaglia: \d+ \/ \d+/)).toBeVisible();
  },
};

export const OverBudget: Story = {
  args: { creatures: [row("solo", 2, 3)] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/oltre il budget/)).toBeVisible();
  },
};

export const WithAdjustment: Story = {
  args: { adjustments: ["easierOrShorter"] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Punti Battaglia/)).toBeVisible();
  },
};

/** A row with no linked adversary is counted apart, never priced at zero. */
export const Unpriced: Story = {
  args: { creatures: [{ quantity: 1, dhAdversary: null }] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/riga senza costo/)).toBeVisible();
  },
};

/** An adversary one tier below the adventure's suggests the +1 adjustment. */
export const LowerTierSuggestion: Story = {
  args: { creatures: [row("standard", 1)] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/grado inferiore/)).toBeVisible();
  },
};

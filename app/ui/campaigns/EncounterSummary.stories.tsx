import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import EncounterSummary from "./EncounterSummary";

/** A 5e fight's XP against the party's three budgets (SPEC-031 §5.B). */
const meta = {
  component: EncounterSummary,
  args: {
    creatures: [
      { xpEach: 200, quantity: 2 },
      { xpEach: 450, quantity: 1 },
    ],
    partySize: 4,
    targetLevel: 4,
  },
} satisfies Meta<typeof EncounterSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/PE: 850/)).toBeVisible();
    await expect(canvas.getByText(/Difficoltà:/)).toBeVisible();
  },
};

export const AboveHigh: Story = {
  args: { creatures: [{ xpEach: 5000, quantity: 3 }] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Letale/)).toBeVisible();
  },
};

export const NothingPriced: Story = {
  args: { creatures: [{ xpEach: null, quantity: 2 }] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText("Nessuna creatura con PE conteggiata")
    ).toBeVisible();
    await expect(canvas.getByText(/riga senza PE/)).toBeVisible();
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import ItemMeta from "./ItemMeta";

/**
 * One label–value pair on a card; the value is a `PageMeta.getDatum` output.
 * Rendered on the dark card surface it lives on (`SpellCard`, `DeityCard`):
 * measured on the default white canvas, the axe gate judged a colour the app
 * never shows (TD-157).
 */
const meta = {
  component: ItemMeta,
  args: { label: "Livello", value: "2" },
  decorators: [
    (Story) => (
      <div className="rounded-xl bg-slate-800 p-4 text-sm text-white">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof ItemMeta>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Text: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Livello:")).toBeVisible();
    await expect(canvas.getByText("2")).toBeVisible();
  },
};

export const RichValue: Story = {
  args: {
    label: "Componenti",
    value: (
      <span>
        V, S, M <em>(una piuma di corvo)</em>
      </span>
    ),
  },
};

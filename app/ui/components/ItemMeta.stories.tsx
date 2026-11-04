import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import ItemMeta from "./ItemMeta";

/** One label–value pair on a card; the value is a `PageMeta.getDatum` output. */
const meta = {
  component: ItemMeta,
  args: { label: "Livello", value: "2" },
  // TD-155: the value's `text-gray-400` on white measures 2.6:1, under the
  // 4.5:1 AA floor. Back to "error" once that item lands.
  parameters: { a11y: { test: "todo" } },
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

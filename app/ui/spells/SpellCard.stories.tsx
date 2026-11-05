import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { frostBlade, lanternOfTheLost } from "@/.storybook/fixtures/spells";
import SpellCard from "./SpellCard";

const meta = {
  component: SpellCard,
  args: {
    cardItem: frostBlade,
  },
} satisfies Meta<typeof SpellCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Collapsed: the header only, the details wait until the card is opened. */
export const Collapsed: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Lama di brina/)).toBeVisible();
    await expect(
      canvas.queryByText(/velo di ghiaccio/)
    ).not.toBeInTheDocument();
  },
};

/** Opened by its header button: the details appear. */
export const Expanded: Story = {
  // TD-157: ItemMeta's text-gray-600 value on the card's slate-800.
  parameters: { a11y: { test: "todo" } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole("button")[0]!);
    await expect(await canvas.findByText(/velo di ghiaccio/)).toBeVisible();
  },
};

/** A second record: no image, and where the model allows it, fewer fields. */
export const Plain: Story = {
  // TD-157: ItemMeta's text-gray-600 value on the card's slate-800.
  parameters: { a11y: { test: "todo" } },
  args: { cardItem: lanternOfTheLost },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole("button")[0]!);
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
  },
};

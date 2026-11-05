import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { helios, selene, heliosPlacement } from "@/.storybook/fixtures/deities";
import DeityCard from "./DeityCard";

const meta = {
  component: DeityCard,
  args: {
    cardItem: helios,
    placement: heliosPlacement,
  },
} satisfies Meta<typeof DeityCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Collapsed: the header only, the details wait until the card is opened. */
export const Collapsed: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Helios/)).toBeVisible();
    await expect(canvas.queryByText(/Paradiso, Cieli/)).not.toBeInTheDocument();
  },
};

/** Opened by its header button: the details appear. */
export const Expanded: Story = {
  // TD-157: ItemMeta's text-gray-600 value on the card's slate-800.
  parameters: { a11y: { test: "todo" } },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole("button")[0]!);
    await expect(await canvas.findByText(/Paradiso, Cieli/)).toBeVisible();
  },
};

/** A second record: no image, and where the model allows it, fewer fields. */
export const Plain: Story = {
  // TD-157: ItemMeta's text-gray-600 value on the card's slate-800.
  parameters: { a11y: { test: "todo" } },
  args: { cardItem: selene },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole("button")[0]!);
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
  },
};

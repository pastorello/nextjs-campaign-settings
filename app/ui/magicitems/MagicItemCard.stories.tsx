import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { sunblade, emberVial } from "@/.storybook/fixtures/magicitems";
import MagicItemCard from "./MagicItemCard";

const meta = {
  component: MagicItemCard,
  args: {
    cardItem: sunblade,
  },
} satisfies Meta<typeof MagicItemCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Collapsed: the header only, the details wait until the card is opened. */
export const Collapsed: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Lama dell'alba/)).toBeVisible();
    await expect(canvas.queryByText(/luce tenue/)).not.toBeInTheDocument();
  },
};

/** Opened by its header button: the details appear. */
export const Expanded: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole("button")[0]!);
    await expect(await canvas.findByText(/luce tenue/)).toBeVisible();
  },
};

/** A second record: no image, and where the model allows it, fewer fields. */
export const Plain: Story = {
  args: { cardItem: emberVial },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole("button")[0]!);
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
  },
};

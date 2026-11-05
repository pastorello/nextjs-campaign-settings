import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { saltCrown, brassCompass } from "@/.storybook/fixtures/treasures";
import TreasureCard from "./TreasureCard";

const meta = {
  component: TreasureCard,
  args: {
    cardItem: saltCrown,
  },
} satisfies Meta<typeof TreasureCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Collapsed: the header only, the details wait until the card is opened. */
export const Collapsed: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Corona di sale/)).toBeVisible();
    await expect(
      canvas.queryByText(/cristalli di sale/)
    ).not.toBeInTheDocument();
  },
};

/** Opened by its header button: the details appear. */
export const Expanded: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole("button")[0]!);
    await expect(await canvas.findByText(/cristalli di sale/)).toBeVisible();
  },
};

/** A second record: no image, and where the model allows it, fewer fields. */
export const Plain: Story = {
  args: { cardItem: brassCompass },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole("button")[0]!);
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
  },
};

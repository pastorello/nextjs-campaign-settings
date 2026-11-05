import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { treasures } from "@/.storybook/fixtures/treasures";
import TreasureLibrary from "./TreasureLibrary";

const meta = {
  component: TreasureLibrary,
  args: {
    items: treasures,
  },
} satisfies Meta<typeof TreasureLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Corona di sale/)).toBeVisible();
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText(/Corona di sale/)).not.toBeInTheDocument();
  },
};

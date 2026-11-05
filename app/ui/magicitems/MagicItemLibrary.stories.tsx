import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { magicItems } from "@/.storybook/fixtures/magicitems";
import MagicItemLibrary from "./MagicItemLibrary";

const meta = {
  component: MagicItemLibrary,
  args: {
    items: magicItems,
  },
} satisfies Meta<typeof MagicItemLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Lama dell'alba/)).toBeVisible();
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText(/Lama dell'alba/)).not.toBeInTheDocument();
  },
};

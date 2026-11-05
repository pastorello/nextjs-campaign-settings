import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { spells } from "@/.storybook/fixtures/spells";
import SpellLibrary from "./SpellLibrary";

const meta = {
  component: SpellLibrary,
  args: {
    items: spells,
  },
} satisfies Meta<typeof SpellLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Lama di brina/)).toBeVisible();
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText(/Lama di brina/)).not.toBeInTheDocument();
  },
};

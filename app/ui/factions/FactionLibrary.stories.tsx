import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { factions, rosters } from "@/.storybook/fixtures/factions";
import FactionLibrary from "./FactionLibrary";

const meta = {
  component: FactionLibrary,
  args: {
    items: factions,
    rosters,
  },
} satisfies Meta<typeof FactionLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Gilda dei Cartografi/)).toBeVisible();
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByText(/Gilda dei Cartografi/)
    ).not.toBeInTheDocument();
  },
};

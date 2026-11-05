import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { deities, deityPlacements } from "@/.storybook/fixtures/deities";
import DeityLibrary from "./DeityLibrary";

const meta = {
  component: DeityLibrary,
  args: {
    items: deities,
    placements: deityPlacements,
  },
} satisfies Meta<typeof DeityLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Helios/)).toBeVisible();
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText(/Helios/)).not.toBeInTheDocument();
  },
};

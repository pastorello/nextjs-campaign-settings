import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { driftwoodCharm, emberTonic } from "@/.storybook/fixtures/daggerheart";
import DhLootCard from "./DhLootCard";

const meta = {
  component: DhLootCard,
  args: { loot: emberTonic },
} satisfies Meta<typeof DhLootCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithRollValue: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("article", { name: "Tonico di Brace" })
    ).toBeVisible();
    await expect(canvas.getByText("Tiro 7")).toBeVisible();
  },
};

export const WithoutRollValue: Story = {
  args: { loot: driftwoodCharm },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText(/^Tiro/)).not.toBeInTheDocument();
  },
};

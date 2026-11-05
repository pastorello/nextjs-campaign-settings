import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { buckler, harpoon } from "@/.storybook/fixtures/daggerheart";
import DhWeaponCard from "./DhWeaponCard";

const meta = {
  component: DhWeaponCard,
  args: { weapon: harpoon },
} satisfies Meta<typeof DhWeaponCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The damage is the die and the bonus: the dice count is Proficiency. */
export const WithFeature: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("article", { name: "Arpione Salmastro" })
    ).toBeVisible();
    await expect(canvas.getByText(/d8\+2/)).toBeVisible();
    await expect(canvas.getByText("Ancora la Preda")).toBeVisible();
  },
};

export const WithoutBonus: Story = {
  args: { weapon: buckler },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/d6/)).toBeVisible();
    await expect(canvas.queryByText(/d6\+/)).not.toBeInTheDocument();
  },
};

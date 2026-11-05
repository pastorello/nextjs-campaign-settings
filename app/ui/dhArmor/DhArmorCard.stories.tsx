import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { plainArmor, wardenArmor } from "@/.storybook/fixtures/daggerheart";
import DhArmorCard from "./DhArmorCard";

const meta = {
  component: DhArmorCard,
  args: { armor: wardenArmor },
} satisfies Meta<typeof DhArmorCard>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithFeature: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("article", { name: "Giaco del Custode" })
    ).toBeVisible();
    await expect(canvas.getByText("7/14")).toBeVisible();
    await expect(canvas.getByText("Placca Tiepida")).toBeVisible();
  },
};

export const WithoutFeature: Story = {
  args: { armor: plainArmor },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText("Placca Tiepida")).not.toBeInTheDocument();
  },
};

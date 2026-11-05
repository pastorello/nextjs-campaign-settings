import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { hillfolk, saltborn } from "@/.storybook/fixtures/daggerheart";
import DhAncestryCardView from "./DhAncestryCardView";

const meta = {
  component: DhAncestryCardView,
  args: { ancestry: saltborn },
} satisfies Meta<typeof DhAncestryCardView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("article", { name: "Nati dal Sale" })
    ).toBeVisible();
    await expect(canvas.getByText("Orecchio di Conchiglia")).toBeVisible();
    await expect(canvas.getByText("Passo Sicuro")).toBeVisible();
  },
};

export const WithoutImage: Story = {
  args: { ancestry: hillfolk, headingLevel: "h2" },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { level: 2, name: "Gente dei Colli" })
    ).toBeVisible();
  },
};

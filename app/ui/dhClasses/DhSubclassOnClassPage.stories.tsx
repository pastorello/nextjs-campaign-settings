import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { vigil } from "@/.storybook/fixtures/daggerheart";
import DhSubclassOnClassPage from "./DhSubclassOnClassPage";

const meta = {
  component: DhSubclassOnClassPage,
  args: { subclass: vigil },
} satisfies Meta<typeof DhSubclassOnClassPage>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Features are grouped by tier; a tier with none is left out. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { level: 3, name: "Via della Veglia" })
    ).toBeVisible();
    await expect(canvas.getByText("Fondamento")).toBeVisible();
    await expect(canvas.getByText("Maestria")).toBeVisible();
    await expect(
      canvas.queryByText("Specializzazione")
    ).not.toBeInTheDocument();
  },
};

export const NoFeatures: Story = {
  args: { subclass: { ...vigil, features: [], description: null } },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole("heading", { level: 4 })
    ).not.toBeInTheDocument();
  },
};

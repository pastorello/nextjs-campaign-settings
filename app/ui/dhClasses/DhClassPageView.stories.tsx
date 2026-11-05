import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { warderClassPage } from "@/.storybook/fixtures/daggerheart";
import DhClassPageView from "./DhClassPageView";

const meta = {
  component: DhClassPageView,
  args: { page: warderClassPage, system: "daggerheart" },
} satisfies Meta<typeof DhClassPageView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { level: 1, name: "Custode" })
    ).toBeVisible();
    await expect(canvas.getByText("Veglia Lunga")).toBeVisible();
    await expect(canvas.getByText("Fiamma Condivisa")).toBeVisible();
    await expect(canvas.getByText("Via della Veglia")).toBeVisible();
    await expect(canvas.getAllByRole("article")).toHaveLength(3);
  },
};

export const WithoutSubclassesOrCards: Story = {
  args: { page: { ...warderClassPage, subclasses: [], cards: [] } },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText("Questa classe non ha ancora sottoclassi.")
    ).toBeVisible();
    await expect(
      canvas.getByText("Nessuna carta dominio trovata")
    ).toBeVisible();
  },
};

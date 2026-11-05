import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { loot, dhPage } from "@/.storybook/fixtures/daggerheart";
import DhLootLibrary from "./DhLootLibrary";

/** Rows by default; `?view=cards` swaps them for the cards (SPEC-027/028/029). */
const meta = {
  component: DhLootLibrary,
  args: { items: loot },
  parameters: { nextjs: dhPage("/loot") },
} satisfies Meta<typeof DhLootLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rows: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("dh-loot-rows")).toBeVisible();
    await expect(canvas.getByText("Tonico di Brace")).toBeVisible();
    await expect(
      canvas.getByText("Talismano di Legno Alla Deriva")
    ).toBeVisible();
    await expect(canvas.queryAllByRole("article")).toHaveLength(0);
  },
};

export const Cards: Story = {
  parameters: { nextjs: dhPage("/loot", { view: "cards" }) },
  play: async ({ canvas }) => {
    await expect(canvas.queryByTestId("dh-loot-rows")).not.toBeInTheDocument();
    await expect(canvas.getAllByRole("article")).toHaveLength(loot.length);
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText("Tonico di Brace")).not.toBeInTheDocument();
  },
};

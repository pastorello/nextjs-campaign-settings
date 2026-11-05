import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { weapons, dhPage } from "@/.storybook/fixtures/daggerheart";
import DhWeaponLibrary from "./DhWeaponLibrary";

/** Rows by default; `?view=cards` swaps them for the cards (SPEC-027/028/029). */
const meta = {
  component: DhWeaponLibrary,
  args: { items: weapons },
  parameters: { nextjs: dhPage("/weapons") },
} satisfies Meta<typeof DhWeaponLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rows: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("dh-weapon-rows")).toBeVisible();
    await expect(canvas.getByText("Arpione Salmastro")).toBeVisible();
    await expect(canvas.getByText("Brocchiere Liso")).toBeVisible();
    await expect(canvas.queryAllByRole("article")).toHaveLength(0);
  },
};

export const Cards: Story = {
  parameters: { nextjs: dhPage("/weapons", { view: "cards" }) },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByTestId("dh-weapon-rows")
    ).not.toBeInTheDocument();
    await expect(canvas.getAllByRole("article")).toHaveLength(weapons.length);
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByText("Arpione Salmastro")
    ).not.toBeInTheDocument();
  },
};

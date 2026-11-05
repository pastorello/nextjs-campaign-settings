import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { armors, dhPage } from "@/.storybook/fixtures/daggerheart";
import DhArmorLibrary from "./DhArmorLibrary";

/** Rows by default; `?view=cards` swaps them for the cards (SPEC-027/028/029). */
const meta = {
  component: DhArmorLibrary,
  args: { items: armors },
  parameters: { nextjs: dhPage("/armor") },
} satisfies Meta<typeof DhArmorLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rows: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("dh-armor-rows")).toBeVisible();
    await expect(canvas.getByText("Giaco del Custode")).toBeVisible();
    await expect(canvas.getByText("Gambesone Rattoppato")).toBeVisible();
    await expect(canvas.queryAllByRole("article")).toHaveLength(0);
  },
};

export const Cards: Story = {
  parameters: { nextjs: dhPage("/armor", { view: "cards" }) },
  play: async ({ canvas }) => {
    await expect(canvas.queryByTestId("dh-armor-rows")).not.toBeInTheDocument();
    await expect(canvas.getAllByRole("article")).toHaveLength(armors.length);
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByText("Giaco del Custode")
    ).not.toBeInTheDocument();
  },
};

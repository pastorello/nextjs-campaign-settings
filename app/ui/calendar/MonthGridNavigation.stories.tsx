import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { human, month, systems, today } from "@/.storybook/fixtures/calendar";
import MonthGridNavigation from "./MonthGridNavigation";

/** Moves the month grid; every move is a URL (SPEC-014 §5.6). */
const meta = {
  component: MonthGridNavigation,
  args: { month, systems, displaySystem: human },
} satisfies Meta<typeof MonthGridNavigation>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WorldHistory: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Mese precedente")).toBeVisible();
    await expect(canvas.getByText("Mese successivo")).toBeVisible();
    // World history has no "today".
    await expect(canvas.queryByText("Oggi")).not.toBeInTheDocument();
    await expect(canvas.getByRole("button", { name: "Vai" })).toBeVisible();
  },
};

export const WithToday: Story = {
  args: { today },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Oggi")).toBeVisible();
  },
};

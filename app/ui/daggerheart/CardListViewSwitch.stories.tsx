import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect } from "storybook/test";

import { dhPage } from "@/.storybook/fixtures/daggerheart";
import CardListViewSwitch from "./CardListViewSwitch";
import { dashboardPath } from "@/i18n/dashboardPath";

/** The view lives in the URL (`?view=cards`), never in component state. */
const meta = {
  component: CardListViewSwitch,
  parameters: { nextjs: dhPage("/adversaries") },
} satisfies Meta<typeof CardListViewSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rows: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("button", { name: "Righe" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    await userEvent.click(canvas.getByRole("button", { name: "Carte" }));
    await expect(getRouter().replace).toHaveBeenCalledWith(
      `${dashboardPath("daggerheart", "/adversaries")}?view=cards`
    );
  },
};

export const Cards: Story = {
  parameters: { nextjs: dhPage("/adversaries", { view: "cards" }) },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("button", { name: "Carte" })).toHaveAttribute(
      "aria-pressed",
      "true"
    );
    // Rows are the default, so choosing them writes no parameter.
    await userEvent.click(canvas.getByRole("button", { name: "Righe" }));
    await expect(getRouter().replace).toHaveBeenCalledWith(
      dashboardPath("daggerheart", "/adversaries")
    );
  },
};

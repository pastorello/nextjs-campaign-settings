import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { ancestries, dhPage } from "@/.storybook/fixtures/daggerheart";
import DhAncestryLibrary from "./DhAncestryLibrary";

/** Rows by default; `?view=cards` swaps them for the cards (SPEC-027/028/029). */
const meta = {
  component: DhAncestryLibrary,
  args: { items: ancestries },
  parameters: { nextjs: dhPage("/ancestries") },
} satisfies Meta<typeof DhAncestryLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rows: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("dh-ancestry-rows")).toBeVisible();
    await expect(canvas.getByText("Nati dal Sale")).toBeVisible();
    await expect(canvas.getByText("Gente dei Colli")).toBeVisible();
    await expect(canvas.queryAllByRole("article")).toHaveLength(0);
  },
};

export const Cards: Story = {
  parameters: { nextjs: dhPage("/ancestries", { view: "cards" }) },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByTestId("dh-ancestry-rows")
    ).not.toBeInTheDocument();
    await expect(canvas.getAllByRole("article")).toHaveLength(
      ancestries.length
    );
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText("Nati dal Sale")).not.toBeInTheDocument();
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { adversaries, dhPage } from "@/.storybook/fixtures/daggerheart";
import DhAdversaryLibrary from "./DhAdversaryLibrary";

/** Rows by default; `?view=cards` swaps them for the cards (SPEC-027/028/029). */
const meta = {
  component: DhAdversaryLibrary,
  args: { items: adversaries },
  parameters: { nextjs: dhPage("/adversaries") },
} satisfies Meta<typeof DhAdversaryLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rows: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("dh-adversary-rows")).toBeVisible();
    await expect(canvas.getByText("Spettro della Lanterna")).toBeVisible();
    await expect(canvas.getByText("Granchio della Scogliera")).toBeVisible();
    await expect(canvas.queryAllByRole("article")).toHaveLength(0);
  },
};

export const Cards: Story = {
  parameters: { nextjs: dhPage("/adversaries", { view: "cards" }) },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByTestId("dh-adversary-rows")
    ).not.toBeInTheDocument();
    await expect(canvas.getAllByRole("article")).toHaveLength(
      adversaries.length
    );
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByText("Spettro della Lanterna")
    ).not.toBeInTheDocument();
  },
};

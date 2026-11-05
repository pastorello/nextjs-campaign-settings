import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { environments, dhPage } from "@/.storybook/fixtures/daggerheart";
import DhEnvironmentLibrary from "./DhEnvironmentLibrary";

/** Rows by default; `?view=cards` swaps them for the cards (SPEC-027/028/029). */
const meta = {
  component: DhEnvironmentLibrary,
  args: { items: environments },
  parameters: { nextjs: dhPage("/environments") },
} satisfies Meta<typeof DhEnvironmentLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rows: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("dh-environment-rows")).toBeVisible();
    await expect(canvas.getByText("Porto nella Nebbia")).toBeVisible();
    await expect(canvas.getByText("Radura Silenziosa")).toBeVisible();
    await expect(canvas.queryAllByRole("article")).toHaveLength(0);
  },
};

export const Cards: Story = {
  parameters: { nextjs: dhPage("/environments", { view: "cards" }) },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByTestId("dh-environment-rows")
    ).not.toBeInTheDocument();
    await expect(canvas.getAllByRole("article")).toHaveLength(
      environments.length
    );
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByText("Porto nella Nebbia")
    ).not.toBeInTheDocument();
  },
};

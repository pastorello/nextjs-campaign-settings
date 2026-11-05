import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { communities, dhPage } from "@/.storybook/fixtures/daggerheart";
import DhCommunityLibrary from "./DhCommunityLibrary";

/** Rows by default; `?view=cards` swaps them for the cards (SPEC-027/028/029). */
const meta = {
  component: DhCommunityLibrary,
  args: { items: communities },
  parameters: { nextjs: dhPage("/communities") },
} satisfies Meta<typeof DhCommunityLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rows: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("dh-community-rows")).toBeVisible();
    await expect(canvas.getByText("Comunità del Porto")).toBeVisible();
    await expect(canvas.getByText("Comunità del Colle")).toBeVisible();
    await expect(canvas.queryAllByRole("article")).toHaveLength(0);
  },
};

export const Cards: Story = {
  parameters: { nextjs: dhPage("/communities", { view: "cards" }) },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByTestId("dh-community-rows")
    ).not.toBeInTheDocument();
    await expect(canvas.getAllByRole("article")).toHaveLength(
      communities.length
    );
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByText("Comunità del Porto")
    ).not.toBeInTheDocument();
  },
};

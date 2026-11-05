import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { dhPage, domainCards } from "@/.storybook/fixtures/daggerheart";
import DhDomainCardLibrary from "./DhDomainCardLibrary";

const meta = {
  component: DhDomainCardLibrary,
  args: { items: domainCards },
  parameters: { nextjs: dhPage("/domain-cards") },
} satisfies Meta<typeof DhDomainCardLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Rows: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("dh-domain-card-rows")).toBeVisible();
    await expect(canvas.getByText("Canto del Porto")).toBeVisible();
  },
};

export const Cards: Story = {
  parameters: { nextjs: dhPage("/domain-cards", { view: "cards" }) },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("article")).toHaveLength(3);
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText("Canto del Porto")).not.toBeInTheDocument();
  },
};

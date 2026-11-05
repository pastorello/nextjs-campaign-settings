import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { dhPage, domains } from "@/.storybook/fixtures/daggerheart";
import DhDomainLibrary from "./DhDomainLibrary";
import { dashboardPath } from "@/i18n/dashboardPath";

const meta = {
  component: DhDomainLibrary,
  args: { items: domains },
  parameters: { nextjs: dhPage("/domains") },
} satisfies Meta<typeof DhDomainLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Each domain links to its own page. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Brace" })).toHaveAttribute(
      "href",
      dashboardPath("daggerheart", "/domains/1")
    );
    await expect(canvas.getAllByRole("article")).toHaveLength(2);
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("article")).not.toBeInTheDocument();
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { classes, dhOptions, dhPage } from "@/.storybook/fixtures/daggerheart";
import DhClassLibrary from "./DhClassLibrary";
import { dashboardPath } from "@/i18n/dashboardPath";

const meta = {
  component: DhClassLibrary,
  args: { items: classes, optionBundle: dhOptions },
  parameters: { nextjs: dhPage("/classes") },
} satisfies Meta<typeof DhClassLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Custode" })).toHaveAttribute(
      "href",
      dashboardPath("daggerheart", "/classes/1")
    );
    await expect(canvas.getByRole("link", { name: "Vagabondo" })).toBeVisible();
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("article")).not.toBeInTheDocument();
  },
};

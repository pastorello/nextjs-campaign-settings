import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { emberDomain, tideDomain } from "@/.storybook/fixtures/daggerheart";
import DhDomainHeader from "./DhDomainHeader";

const meta = {
  component: DhDomainHeader,
  args: { domain: emberDomain },
} satisfies Meta<typeof DhDomainHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithEmblem: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { level: 1, name: "Brace" })
    ).toBeVisible();
    await expect(canvas.getByRole("img")).toBeVisible();
  },
};

export const WithoutEmblem: Story = {
  args: { domain: tideDomain },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
  },
};

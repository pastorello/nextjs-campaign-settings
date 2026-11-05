import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import {
  dhPage,
  harborCommunity,
  quietCommunity,
} from "@/.storybook/fixtures/daggerheart";
import DhCommunityCardView from "./DhCommunityCardView";

const meta = {
  component: DhCommunityCardView,
  args: { community: harborCommunity },
  parameters: { nextjs: dhPage("/communities") },
} satisfies Meta<typeof DhCommunityCardView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Places and factions are links into the world. */
export const WithLinks: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("link", { name: "Molo dei Sospiri" })
    ).toHaveAttribute("href", expect.stringContaining("/geography?place=3"));
    await expect(
      canvas.getByRole("link", { name: "Gilda dei Cartografi" })
    ).toBeVisible();
    await expect(canvas.getByText(/solidale/)).toBeVisible();
  },
};

export const Plain: Story = {
  args: { community: quietCommunity },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("link")).not.toBeInTheDocument();
  },
};

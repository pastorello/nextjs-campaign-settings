import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import NavLinks from "./nav-links";
import { dashboardPath } from "@/i18n/dashboardPath";

/** The sidebar's page links, grouped; the current page is highlighted. */
const meta = {
  component: NavLinks,
  parameters: {
    nextjs: {
      navigation: {
        pathname: dashboardPath("dnd5e", "/spells"),
        segments: [["system", "dnd5e"]],
      },
    },
  },
  decorators: [
    (Story) => (
      <nav aria-label="Sidebar" className="flex w-64 flex-col gap-2">
        <Story />
      </nav>
    ),
  ],
} satisfies Meta<typeof NavLinks>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DungeonMaster: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getAllByRole("link").length).toBeGreaterThan(3);
  },
};

export const Player: Story = { args: { player: true } };

export const Daggerheart: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: dashboardPath("daggerheart", "/classes"),
        segments: [["system", "daggerheart"]],
      },
    },
  },
};

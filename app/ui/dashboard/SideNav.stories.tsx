import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { dm, player, playerInOneCampaign } from "@/.storybook/fixtures/viewers";
import SideNav from "./sidenav";
import { dashboardPath } from "@/i18n/dashboardPath";

/**
 * The dashboard's sidebar, an async Server Component. The DM gets every page
 * and the game-system switch; a player gets the pages open to them and, with
 * more than one campaign, the campaign switch instead (SPEC-022 T7).
 */
const meta = {
  component: SideNav,
  args: { viewer: dm },
  parameters: {
    layout: "fullscreen",
    nextjs: {
      navigation: {
        pathname: dashboardPath("dnd5e", "/spells"),
        segments: [["system", "dnd5e"]],
      },
    },
  },
  decorators: [
    (Story) => (
      <div className="h-[800px] w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SideNav>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DungeonMaster: Story = {
  play: async ({ canvas }) => {
    const nav = await canvas.findByRole("navigation");
    await expect(nav).toBeVisible();
    await expect(
      canvas.getByRole("combobox", { name: /sistema/i })
    ).toBeVisible();
  },
};

export const Player: Story = {
  args: { viewer: player },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole("combobox", { name: /campagna/i })
    ).toBeVisible();
    await expect(
      canvas.queryByRole("combobox", { name: /sistema/i })
    ).toBeNull();
  },
};

/** One campaign: nothing to switch between. */
export const PlayerInOneCampaign: Story = {
  args: { viewer: playerInOneCampaign },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect, mocked, waitFor } from "storybook/test";

import { campaigns } from "@/.storybook/fixtures/viewers";
import selectCampaign from "@/app/lib/auth/selectCampaign";
import CampaignSelector from "./CampaignSelector";
import LocaleSwitcher from "./LocaleSwitcher";
import SystemSwitcher from "./SystemSwitcher";
import { dashboardPath } from "@/i18n/dashboardPath";

/**
 * The sidebar's three switches: game system (ADR-0013), language (ADR-0006)
 * and, for a player in several campaigns, the campaign (SPEC-022).
 */
const meta = {
  component: SystemSwitcher,
  subcomponents: { LocaleSwitcher, CampaignSelector },
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
      <div className="w-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof SystemSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

export const GameSystem: Story = {
  play: async ({ canvas, userEvent }) => {
    const select = canvas.getByRole("combobox");
    await expect(select).toHaveValue("dnd5e");
    await userEvent.selectOptions(select, "daggerheart");
    await expect(getRouter().push).toHaveBeenCalled();
  },
};

export const Language: Story = {
  render: () => <LocaleSwitcher />,
  play: async ({ canvas, userEvent }) => {
    await userEvent.selectOptions(canvas.getByRole("combobox"), "en");
    await expect(getRouter().replace).toHaveBeenCalled();
  },
};

export const Campaign: Story = {
  render: () => <CampaignSelector campaigns={campaigns} currentId={1} />,
  beforeEach: () => {
    mocked(selectCampaign).mockResolvedValue({
      ok: true,
      system: "daggerheart",
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.selectOptions(canvas.getByRole("combobox"), "2");
    await waitFor(() =>
      expect(selectCampaign).toHaveBeenCalledWith({ campaignId: 2 })
    );
  },
};

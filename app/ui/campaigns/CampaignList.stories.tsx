import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { campaignCards } from "@/.storybook/fixtures/campaigns";
import { dashboardPath } from "@/i18n/dashboardPath";
import CampaignList from "./CampaignList";

/** The campaign cards of one game system. */
const meta = {
  component: CampaignList,
  args: { campaigns: campaignCards, system: "dnd5e" },
} satisfies Meta<typeof CampaignList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    const link = canvas.getByRole("link", { name: /La caduta di Kang/ });
    await expect(link).toHaveAttribute(
      "href",
      dashboardPath("dnd5e", "/campaign/1")
    );
    await expect(canvas.getByText(/3 avventure/)).toBeVisible();
    await expect(canvas.getByText(/Nessuna avventura/)).toBeVisible();
  },
};

export const Daggerheart: Story = {
  args: { system: "daggerheart" },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("link", { name: /La caduta di Kang/ })
    ).toHaveAttribute("href", dashboardPath("daggerheart", "/campaign/1"));
  },
};

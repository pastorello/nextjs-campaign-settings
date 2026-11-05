import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { campaign } from "@/.storybook/fixtures/campaigns";
import CampaignHeader from "./CampaignHeader";

/** A campaign page's title, synopsis and party size, with an inline edit. */
const meta = {
  component: CampaignHeader,
  args: { campaign },
} satisfies Meta<typeof CampaignHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { name: campaign.title })
    ).toBeVisible();
    await expect(canvas.getByText(/mappa che nessuno finisce/)).toBeVisible();
  },
};

export const NoSynopsis: Story = {
  args: { campaign: { ...campaign, synopsis: null } },
};

export const Editing: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Modifica" }));
    await expect(
      canvas.getByRole("button", { name: "Salva modifiche" })
    ).toBeVisible();
  },
};

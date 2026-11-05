import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";

import { players } from "@/.storybook/fixtures/campaigns";
import addCampaignMember from "@/app/lib/data/campaigns/addCampaignMember";
import removeCampaignMember from "@/app/lib/data/campaigns/removeCampaignMember";
import CampaignPlayersSection from "./CampaignPlayers";

/** Who plays a campaign, and who may be added to it (SPEC-022). */
const meta = {
  component: CampaignPlayersSection,
  args: { campaignId: 1, players },
} satisfies Meta<typeof CampaignPlayersSection>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Giulia")).toBeVisible();
  },
};

export const Empty: Story = {
  args: { players: { members: [], candidates: [] } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Nessun giocatore ancora.")).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "Vai agli account" })
    ).toBeVisible();
  },
};

export const Remove: Story = {
  beforeEach: () => {
    mocked(removeCampaignMember).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Togli Giulia dalla campagna" })
    );
    await waitFor(() =>
      expect(removeCampaignMember).toHaveBeenCalledWith({
        campaignId: 1,
        userId: "u1",
      })
    );
  },
};

export const Add: Story = {
  beforeEach: () => {
    mocked(addCampaignMember).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    // The candidate is preselected: the first one offered.
    await userEvent.click(
      canvas.getByRole("button", { name: "Aggiungi alla campagna" })
    );
    await waitFor(() =>
      expect(addCampaignMember).toHaveBeenCalledWith({
        campaignId: 1,
        userId: "u2",
      })
    );
  },
};

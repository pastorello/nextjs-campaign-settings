import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";

import archiveCampaign from "@/app/lib/data/campaigns/archiveCampaign";
import copyCampaign from "@/app/lib/data/campaigns/copyCampaign";
import restoreCampaign from "@/app/lib/data/campaigns/restoreCampaign";
import CampaignActions from "./CampaignActions";

/** The campaign page's copy and archive actions (SPEC-032 §5.5, §5.6). */
const meta = {
  component: CampaignActions,
  args: { campaignId: 1, archived: false, system: "dnd5e" },
} satisfies Meta<typeof CampaignActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  beforeEach: () => {
    mocked(archiveCampaign).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Archivia campagna" })
    );
    await waitFor(() =>
      expect(archiveCampaign).toHaveBeenCalledWith({ campaignId: 1 })
    );
  },
};

export const Archived: Story = {
  args: { archived: true },
  beforeEach: () => {
    mocked(restoreCampaign).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Riattiva campagna" })
    );
    await waitFor(() =>
      expect(restoreCampaign).toHaveBeenCalledWith({ campaignId: 1 })
    );
  },
};

export const Copy: Story = {
  beforeEach: () => {
    mocked(copyCampaign).mockResolvedValue({ ok: true, id: 12 });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Copia campagna" })
    );
    await waitFor(() =>
      expect(copyCampaign).toHaveBeenCalledWith({ campaignId: 1 })
    );
  },
};

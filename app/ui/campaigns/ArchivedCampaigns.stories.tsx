import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";

import { archivedCampaigns } from "@/.storybook/fixtures/campaigns";
import restoreCampaign from "@/app/lib/data/campaigns/restoreCampaign";
import ArchivedCampaigns from "./ArchivedCampaigns";

/** The campaigns the DM has set aside, each one restorable (SPEC-032 §5.6). */
const meta = {
  component: ArchivedCampaigns,
  args: { campaigns: archivedCampaigns, system: "dnd5e" },
} satisfies Meta<typeof ArchivedCampaigns>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    // The list is collapsed until the summary is opened.
    await expect(canvas.getByText("Il Concilio dei Sette")).not.toBeVisible();
    await userEvent.click(canvas.getByText("1 campagna archiviata"));
    await expect(canvas.getByText("Il Concilio dei Sette")).toBeVisible();
  },
};

export const Restore: Story = {
  beforeEach: () => {
    mocked(restoreCampaign).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByText("1 campagna archiviata"));
    await userEvent.click(
      canvas.getByRole("button", { name: "Riattiva Il Concilio dei Sette" })
    );
    await waitFor(() =>
      expect(restoreCampaign).toHaveBeenCalledWith({ campaignId: 7 })
    );
  },
};

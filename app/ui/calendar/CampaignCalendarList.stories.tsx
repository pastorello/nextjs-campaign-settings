import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, screen, waitFor, within } from "storybook/test";

import {
  campaignEvents,
  campaignHistory,
  human,
  ownerOptions,
  systems,
  today,
} from "@/.storybook/fixtures/calendar";
import deleteCampaignEventById from "@/app/lib/data/calendar/deleteCampaignEventById";
import { dashboardPath } from "@/i18n/dashboardPath";
import CampaignCalendarList from "./CampaignCalendarList";

/**
 * A campaign's calendar as a list (SPEC-014 §5.5): past events dimmed, the
 * one spanning today highlighted, world history dashed and read-only.
 */
const meta = {
  component: CampaignCalendarList,
  args: {
    campaignId: 1,
    events: campaignEvents,
    history: campaignHistory,
    today,
    systems,
    displaySystem: human,
    ownerOptions,
  },
} satisfies Meta<typeof CampaignCalendarList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Banchetto del console")).toBeVisible();
    await expect(canvas.getByText("La Caduta del Faro")).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "Il Passo Spezzato" })
    ).toHaveAttribute("href", dashboardPath("dnd5e", "/adventure/5"));
  },
};

export const NoCurrentDay: Story = {
  args: { today: null },
  play: async ({ canvas }) => {
    // Without a "today" nothing reads as past.
    await expect(canvas.queryByText("Passato")).not.toBeInTheDocument();
  },
};

export const Empty: Story = {
  args: { events: [], history: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText(
        "Ancora nessun evento nel calendario di questa campagna."
      )
    ).toBeVisible();
  },
};

export const Delete: Story = {
  beforeEach: () => {
    mocked(deleteCampaignEventById).mockResolvedValue(undefined);
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getAllByRole("button", { name: /Elimina/ })[0]!
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /elimina/i })
    );
    await waitFor(() => expect(deleteCampaignEventById).toHaveBeenCalled());
  },
};

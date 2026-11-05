import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen } from "storybook/test";

import {
  campaignEvents,
  campaignHistory,
  human,
  month,
  ownerOptions,
  systems,
  today,
} from "@/.storybook/fixtures/calendar";
import CampaignMonthGrid from "./CampaignMonthGrid";

/** A campaign's calendar as a month grid (SPEC-014 §5.5/§5.6). */
const meta = {
  component: CampaignMonthGrid,
  args: {
    campaignId: 1,
    month,
    events: campaignEvents,
    history: campaignHistory,
    today,
    moonReferenceDay: null,
    systems,
    displaySystem: human,
    ownerOptions,
  },
} satisfies Meta<typeof CampaignMonthGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getAllByTestId("campaign-grid-event").length
    ).toBeGreaterThan(0);
    // World history is read-only, and named as such to a screen reader.
    await expect(
      canvas.getAllByTestId("calendar-history-grid-event")[0]
    ).toHaveTextContent("Storia del mondo");
  },
};

export const WithMoon: Story = {
  args: { moonReferenceDay: today - 3 },
  play: async ({ canvas }) => {
    await expect(
      canvas.getAllByTestId("month-grid-moon").length
    ).toBeGreaterThan(0);
  },
};

export const EditOpensForm: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Banchetto/ }));
    await expect(
      await screen.findByRole("button", { name: "Salva evento" })
    ).toBeVisible();
  },
};

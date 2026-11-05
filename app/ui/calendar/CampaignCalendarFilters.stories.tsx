import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { ownerOptions } from "@/.storybook/fixtures/calendar";
import CampaignCalendarFilters from "./CampaignCalendarFilters";

/** The campaign calendar's adventure filter, a URL parameter (SPEC-014 §5.6). */
const meta = {
  component: CampaignCalendarFilters,
  args: { adventureId: null, adventures: ownerOptions.adventures },
} satisfies Meta<typeof CampaignCalendarFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllAdventures: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Avventura" })
    ).toBeVisible();
    await expect(canvas.getByText("Tutte le avventure")).toBeVisible();
  },
};

export const Filtered: Story = {
  args: { adventureId: 5 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Il Passo Spezzato")).toBeVisible();
  },
};

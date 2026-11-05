import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { campaignEvents, human } from "@/.storybook/fixtures/calendar";
import { dashboardPath } from "@/i18n/dashboardPath";
import UpcomingEvents from "./UpcomingEvents";

/** The campaign page's "coming up" (SPEC-014 §5.5). */
const meta = {
  component: UpcomingEvents,
  args: {
    campaignId: 1,
    system: "dnd5e",
    displaySystem: human,
    upcoming: campaignEvents.map((event) => ({
      event,
      startDay: event.startDay,
      endDay: event.endDay ?? event.startDay,
    })),
  },
} satisfies Meta<typeof UpcomingEvents>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Banchetto del console")).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "Apri il calendario" })
    ).toHaveAttribute("href", dashboardPath("dnd5e", "/campaign/1/calendar"));
  },
};

export const NothingUpcoming: Story = {
  args: { upcoming: [] },
  play: async ({ canvas }) => {
    // It renders nothing at all, not an empty heading.
    await expect(canvas.queryByRole("heading")).not.toBeInTheDocument();
    await expect(canvas.queryByRole("link")).not.toBeInTheDocument();
  },
};

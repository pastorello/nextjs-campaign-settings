import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen } from "storybook/test";

import {
  campaignEvents,
  day,
  human,
  month,
  today,
} from "@/.storybook/fixtures/calendar";
import { buildMonthView } from "@/app/lib/calendar/buildMonthView";
import type CampaignEvent from "@/app/lib/definitions/interfaces/calendar/CampaignEvent";
import MonthGrid from "./MonthGrid";

/** One month as a calendar, shared by world history and the campaign's. */
const meta = {
  component: MonthGrid<CampaignEvent>,
  args: {
    month: buildMonthView(month, campaignEvents, day(1)),
    displaySystem: human,
    itemKey: (event: CampaignEvent) => event.id,
    itemStyle: () => ({
      className: "bg-blue-100 text-blue-900",
      testId: "grid-event",
    }),
    renderForm: (event: CampaignEvent, close: () => void) => (
      <button type="button" onClick={close}>
        {`Chiudi ${event.title}`}
      </button>
    ),
  },
} satisfies Meta<typeof MonthGrid<CampaignEvent>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("month-grid")).toBeVisible();
    await expect(canvas.getAllByTestId("month-grid-day")).toHaveLength(31);
    // The march spans four days.
    await expect(
      canvas.getAllByText("Marcia sul valico").length
    ).toBeGreaterThan(1);
  },
};

export const WithToday: Story = {
  args: { today },
  play: async ({ canvas }) => {
    await expect(
      canvas
        .getAllByTestId("month-grid-day")
        .filter((cell) => cell.getAttribute("aria-current") === "date")
    ).toHaveLength(1);
  },
};

/** An event the viewer cannot edit is plain text, not a button. */
export const ReadOnlyEvents: Story = {
  args: { isEditable: () => false },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole("button", { name: /Banchetto/ })
    ).not.toBeInTheDocument();
  },
};

export const EditOpensForm: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Banchetto/ }));
    // The form opens in a dialog, in a portal.
    await expect(
      await screen.findByRole("button", { name: /^Chiudi Banchetto/ })
    ).toBeVisible();
  },
};

export const KeyboardNavigation: Story = {
  play: async ({ canvas, userEvent }) => {
    const first = canvas.getAllByTestId("month-grid-day")[0]!;
    first.focus();
    await userEvent.keyboard("{ArrowRight}");
    await expect(canvas.getAllByTestId("month-grid-day")[1]).toHaveFocus();
  },
};

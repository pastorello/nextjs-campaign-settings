import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen } from "storybook/test";

import {
  day,
  historyEvents,
  human,
  linkOptions,
  month,
  systems,
} from "@/.storybook/fixtures/calendar";
import WorldHistoryMonthGrid from "./WorldHistoryMonthGrid";

/** World history as a month grid (SPEC-014 §5.6). */
const meta = {
  component: WorldHistoryMonthGrid,
  args: {
    month,
    events: historyEvents,
    moonReferenceDay: null,
    systems,
    displaySystem: human,
    linkOptions,
  },
} satisfies Meta<typeof WorldHistoryMonthGrid>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getAllByTestId("world-history-grid-event").length
    ).toBeGreaterThan(0);
    // The yearly feast falls on its day of this month.
    await expect(canvas.getByText("Festa delle Lanterne")).toBeVisible();
  },
};

export const WithMoon: Story = {
  args: { moonReferenceDay: day(1) },
  play: async ({ canvas }) => {
    await expect(
      canvas.getAllByTestId("month-grid-moon").length
    ).toBeGreaterThan(0);
  },
};

export const EditOpensForm: Story = {
  play: async ({ canvas, userEvent }) => {
    // The three-day event is on three cells; any of them opens it.
    await userEvent.click(
      canvas.getAllByRole("button", { name: /Caduta/ })[0]!
    );
    await expect(
      await screen.findByRole("button", { name: "Salva evento" })
    ).toBeVisible();
  },
};

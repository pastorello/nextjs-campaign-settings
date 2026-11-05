import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { human, historyEvents } from "@/.storybook/fixtures/calendar";
import EventSummary, { EventBadge } from "./EventSummary";

/** One event as the chronological lists show it (SPEC-014 §5.6). */
const meta = {
  component: EventSummary,
  args: { event: historyEvents[0]!, displaySystem: human },
} satisfies Meta<typeof EventSummary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Ranged: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("La Caduta del Faro")).toBeVisible();
    await expect(canvas.getByText(/spense/)).toBeVisible();
  },
};

export const YearlyWithBadge: Story = {
  args: {
    event: historyEvents[1]!,
    badges: <EventBadge>Esempio</EventBadge>,
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Annuale")).toBeVisible();
    await expect(canvas.getByText("Esempio")).toBeVisible();
  },
};

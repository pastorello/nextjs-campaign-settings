import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";

import { human, systems, today } from "@/.storybook/fixtures/calendar";
import setCampaignCurrentDay from "@/app/lib/data/calendar/setCampaignCurrentDay";
import CurrentDayForm from "./CurrentDayForm";

/** The campaign's "today" (SPEC-014 §5.5). */
const meta = {
  component: CurrentDayForm,
  args: { campaignId: 1, systems, displaySystem: human, currentDay: today },
  beforeEach: () => {
    mocked(setCampaignCurrentDay).mockResolvedValue({ ok: true });
  },
} satisfies Meta<typeof CurrentDayForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const WithToday: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Avanza di un giorno" })
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Cancella oggi" })
    ).toBeVisible();
  },
};

export const Unset: Story = {
  args: { currentDay: null },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Nessun giorno corrente/)).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Avanza di un giorno" })
    ).not.toBeInTheDocument();
  },
};

export const Advance: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Avanza di un giorno" })
    );
    await waitFor(() =>
      expect(setCampaignCurrentDay).toHaveBeenCalledWith(1, {
        currentDay: today + 1,
      })
    );
  },
};

export const Clear: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Cancella oggi" })
    );
    await waitFor(() =>
      expect(setCampaignCurrentDay).toHaveBeenCalledWith(1, {
        currentDay: null,
      })
    );
  },
};

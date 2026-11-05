import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, screen, waitFor, within } from "storybook/test";

import {
  historyEvents,
  human,
  linkOptions,
  systems,
} from "@/.storybook/fixtures/calendar";
import deleteWorldHistoryEventById from "@/app/lib/data/calendar/deleteWorldHistoryEventById";
import { dashboardPath } from "@/i18n/dashboardPath";
import WorldHistoryList from "./WorldHistoryList";

/** World history as a chronological list (SPEC-014 §5.6). */
const meta = {
  component: WorldHistoryList,
  args: {
    events: historyEvents,
    systems,
    displaySystem: human,
    linkOptions,
  },
} satisfies Meta<typeof WorldHistoryList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("La Caduta del Faro")).toBeVisible();
    await expect(canvas.getByText("Festa delle Lanterne")).toBeVisible();
    // Each link leads where the app already leads for that kind of row.
    await expect(
      canvas.getByRole("link", { name: "Skreebar" })
    ).toHaveAttribute("href", dashboardPath("dnd5e", "/geography?place=4"));
  },
};

export const Empty: Story = {
  args: { events: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText("Nessun evento nella storia del mondo.")
    ).toBeVisible();
  },
};

export const Delete: Story = {
  beforeEach: () => {
    mocked(deleteWorldHistoryEventById).mockResolvedValue(undefined);
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getAllByRole("button", { name: /Elimina/ })[0]!
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /elimina/i })
    );
    await waitFor(() =>
      expect(deleteWorldHistoryEventById).toHaveBeenCalledWith(
        historyEvents[0]!.id
      )
    );
  },
};

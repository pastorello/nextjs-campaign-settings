import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, screen, waitFor, within } from "storybook/test";

import { campaignEvents, human } from "@/.storybook/fixtures/calendar";
import type CampaignEvent from "@/app/lib/definitions/interfaces/calendar/CampaignEvent";
import EventList from "./EventList";
import EventSummary from "./EventSummary";

/**
 * The chronological list world history and the campaign calendar share
 * (SPEC-014 §5.6): events grouped by year and month, with add, edit and a
 * confirmed delete.
 */
const meta = {
  component: EventList<CampaignEvent>,
  args: {
    events: campaignEvents,
    displaySystem: human,
    itemKey: (event: CampaignEvent) => event.id,
    itemAttributes: () => ({
      className: "rounded-md border p-4",
      testId: "item",
    }),
    renderDetails: (event: CampaignEvent) => (
      <EventSummary event={event} displaySystem={human} />
    ),
    renderForm: (event: CampaignEvent | undefined, close: () => void) => (
      <button type="button" onClick={close}>
        {event ? `Chiudi ${event.title}` : "Chiudi nuovo"}
      </button>
    ),
    onDelete: fn(() => Promise.resolve()),
    addLabel: "Nuovo evento",
    emptyMessage: "Nessun evento.",
  },
} satisfies Meta<typeof EventList<CampaignEvent>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Banchetto del console")).toBeVisible();
    await expect(canvas.getAllByTestId("item")).toHaveLength(
      campaignEvents.length
    );
  },
};

export const Empty: Story = {
  args: { events: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Nessun evento.")).toBeVisible();
  },
};

export const AddAndEdit: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Nuovo evento" }));
    await userEvent.click(canvas.getByRole("button", { name: "Chiudi nuovo" }));
    await expect(
      canvas.queryByRole("button", { name: "Chiudi nuovo" })
    ).not.toBeInTheDocument();

    await userEvent.click(
      canvas.getAllByRole("button", { name: /Modifica/ })[0]!
    );
    await expect(
      canvas.getByRole("button", { name: /^Chiudi Banchetto/ })
    ).toBeVisible();
  },
};

/** The one event `isEditable` refuses offers no buttons. */
export const ReadOnlyItem: Story = {
  args: { isEditable: (event: CampaignEvent) => event.id !== 11 },
  play: async ({ canvas }) => {
    await expect(
      canvas.getAllByRole("button", { name: /Modifica/ })
    ).toHaveLength(campaignEvents.length - 1);
  },
};

/** Deleting asks first; the dialog is in a portal, so it is read from `screen`. */
export const Delete: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getAllByRole("button", { name: /Elimina/ })[0]!
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /elimina/i })
    );
    await waitFor(() =>
      expect(args.onDelete).toHaveBeenCalledWith(campaignEvents[0])
    );
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import {
  campaignEvents,
  human,
  ownerOptions,
  systems,
} from "@/.storybook/fixtures/calendar";
import createCampaignEvent from "@/app/lib/data/calendar/createCampaignEvent";
import updateCampaignEvent from "@/app/lib/data/calendar/updateCampaignEvent";
import CampaignEventForm from "./CampaignEventForm";

/** Adds or edits a campaign event (SPEC-014 §5.4). */
const meta = {
  component: CampaignEventForm,
  args: {
    campaignId: 1,
    systems,
    displaySystemId: human.id,
    ownerOptions,
    onCancel: fn(),
    onSaved: fn(),
  },
} satisfies Meta<typeof CampaignEventForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createCampaignEvent).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: /titolo/i }),
      "Veglia al faro"
    );
    await userEvent.type(canvas.getByLabelText("Giorno"), "5");
    await userEvent.click(
      canvas.getByRole("button", { name: "Aggiungi evento" })
    );

    await waitFor(() =>
      expect(createCampaignEvent).toHaveBeenCalledWith(
        1,
        expect.objectContaining({ title: "Veglia al faro" })
      )
    );
    await waitFor(() => expect(args.onSaved).toHaveBeenCalledOnce());
  },
};

export const Edit: Story = {
  args: { event: campaignEvents[0]! },
  beforeEach: () => {
    mocked(updateCampaignEvent).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("textbox", { name: /titolo/i })).toHaveValue(
      "Banchetto del console"
    );
    await userEvent.click(canvas.getByRole("button", { name: "Salva evento" }));
    await waitFor(() =>
      expect(updateCampaignEvent).toHaveBeenCalledWith(
        campaignEvents[0]!.id,
        expect.objectContaining({ title: "Banchetto del console" })
      )
    );
  },
};

export const Cancel: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Annulla" }));
    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};

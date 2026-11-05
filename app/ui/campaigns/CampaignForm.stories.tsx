import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { campaign } from "@/.storybook/fixtures/campaigns";
import createCampaign from "@/app/lib/data/campaigns/createCampaign";
import updateCampaign from "@/app/lib/data/campaigns/updateCampaign";
import CampaignForm from "./CampaignForm";

/** Creates or edits a campaign (SPEC-032 §5.3). */
const meta = {
  component: CampaignForm,
  args: { onCancel: fn(), onSaved: fn() },
} satisfies Meta<typeof CampaignForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createCampaign).mockResolvedValue({ ok: true, id: 9 });
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Titolo" }),
      "Le Maree di Ossa"
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Crea campagna" })
    );
    await waitFor(() =>
      expect(createCampaign).toHaveBeenCalledWith(
        expect.objectContaining({ title: "Le Maree di Ossa", system: "dnd5e" })
      )
    );
    await waitFor(() => expect(args.onSaved).toHaveBeenCalledOnce());
  },
};

export const Edit: Story = {
  args: { campaign },
  beforeEach: () => {
    mocked(updateCampaign).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("textbox", { name: "Titolo" })).toHaveValue(
      campaign.title
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Salva modifiche" })
    );
    await waitFor(() =>
      expect(updateCampaign).toHaveBeenCalledWith(
        expect.objectContaining({ id: campaign.id, title: campaign.title })
      )
    );
  },
};

export const Refused: Story = {
  beforeEach: () => {
    mocked(createCampaign).mockResolvedValue({
      ok: false,
      errors: { title: [{ key: "tooLong", values: { maximum: 80 } }] },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole("textbox", { name: "Titolo" }), "x");
    await userEvent.click(
      canvas.getByRole("button", { name: "Crea campagna" })
    );
    await waitFor(() => expect(createCampaign).toHaveBeenCalled());
  },
};

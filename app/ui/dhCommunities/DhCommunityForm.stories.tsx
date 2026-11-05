import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { harborCommunity, dhOptions } from "@/.storybook/fixtures/daggerheart";
import createDhCommunity from "@/app/lib/data/dhCommunities/createDhCommunity";
import updateDhCommunity from "@/app/lib/data/dhCommunities/updateDhCommunity";
import DhCommunityForm from "./DhCommunityForm";

/** The create and update actions are Server Actions, so spies here (ADR-0021). */
const meta = {
  component: DhCommunityForm,
  args: {
    onCancel: fn(),
    onSaveFinished: fn(),
    optionBundle: dhOptions,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DhCommunityForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createDhCommunity).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    const submit = canvas.getByRole("button", { name: "Crea comunità" });
    await expect(submit).toBeDisabled();

    await userEvent.type(
      canvas.getByRole("textbox", { name: "Nome" }),
      "Nuovo nome"
    );
    await userEvent.click(submit);

    await waitFor(() =>
      expect(createDhCommunity).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Nuovo nome" })
      )
    );
    await expect(args.onSaveFinished).toHaveBeenCalledOnce();
  },
};

export const Edit: Story = {
  args: { formData: harborCommunity },
  beforeEach: () => {
    mocked(updateDhCommunity).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    const name = canvas.getByRole("textbox", { name: "Nome" });
    await expect(name).toHaveValue(harborCommunity.name);

    await userEvent.clear(name);
    await userEvent.type(name, "Nome nuovo");
    await userEvent.click(
      canvas.getByRole("button", { name: "Salva comunità" })
    );

    // An edit sends the id and the edited fields only.
    await waitFor(() =>
      expect(updateDhCommunity).toHaveBeenCalledWith({
        id: harborCommunity.id,
        name: "Nome nuovo",
      })
    );
  },
};

export const Cancel: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Annulla" }));
    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};

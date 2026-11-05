import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { helios } from "@/.storybook/fixtures/deities";
import createDeity from "@/app/lib/data/deities/createDeity";
import updateDeity from "@/app/lib/data/deities/updateDeity";
import DeityForm from "./DeityForm";

/** The create and update actions are Server Actions, so spies here (ADR-0021). */
const meta = {
  component: DeityForm,
  args: { onCancel: fn(), onSaveFinished: fn() },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DeityForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createDeity).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    const submit = canvas.getByRole("button", { name: "Crea divinità" });
    await expect(submit).toBeDisabled();

    await userEvent.type(canvas.getByRole("textbox", { name: /nome/i }), "Eos");
    await userEvent.click(submit);

    await waitFor(() =>
      expect(createDeity).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Eos" })
      )
    );
    await expect(args.onSaveFinished).toHaveBeenCalledOnce();
  },
};

export const Edit: Story = {
  args: { formData: helios },
  beforeEach: () => {
    mocked(updateDeity).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    const name = canvas.getByRole("textbox", { name: /nome/i });
    await expect(name).toHaveValue(helios.name);

    await userEvent.clear(name);
    await userEvent.type(name, "Helios il Grande");
    await userEvent.click(
      canvas.getByRole("button", { name: "Modifica divinità" })
    );

    // An edit sends the id and the edited fields only.
    await waitFor(() =>
      expect(updateDeity).toHaveBeenCalledWith({
        id: helios.id,
        name: "Helios il Grande",
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

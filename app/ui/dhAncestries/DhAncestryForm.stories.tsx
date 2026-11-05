import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { saltborn } from "@/.storybook/fixtures/daggerheart";
import createDhAncestry from "@/app/lib/data/dhAncestries/createDhAncestry";
import updateDhAncestry from "@/app/lib/data/dhAncestries/updateDhAncestry";
import DhAncestryForm from "./DhAncestryForm";

/** The create and update actions are Server Actions, so spies here (ADR-0021). */
const meta = {
  component: DhAncestryForm,
  args: {
    onCancel: fn(),
    onSaveFinished: fn(),
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DhAncestryForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createDhAncestry).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    const submit = canvas.getByRole("button", { name: "Crea ascendenza" });
    await expect(submit).toBeDisabled();

    await userEvent.type(
      canvas.getByRole("textbox", { name: "Nome" }),
      "Nuovo nome"
    );
    await userEvent.click(submit);

    await waitFor(() =>
      expect(createDhAncestry).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Nuovo nome" })
      )
    );
    await expect(args.onSaveFinished).toHaveBeenCalledOnce();
  },
};

export const Edit: Story = {
  args: { formData: saltborn },
  beforeEach: () => {
    mocked(updateDhAncestry).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    const name = canvas.getByRole("textbox", { name: "Nome" });
    await expect(name).toHaveValue(saltborn.name);

    await userEvent.clear(name);
    await userEvent.type(name, "Nome nuovo");
    await userEvent.click(
      canvas.getByRole("button", { name: "Salva ascendenza" })
    );

    // An edit sends the id and the edited fields only.
    await waitFor(() =>
      expect(updateDhAncestry).toHaveBeenCalledWith({
        id: saltborn.id,
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

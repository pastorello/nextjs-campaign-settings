import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { vigil, dhOptions } from "@/.storybook/fixtures/daggerheart";
import createDhSubclass from "@/app/lib/data/dhSubclasses/createDhSubclass";
import updateDhSubclass from "@/app/lib/data/dhSubclasses/updateDhSubclass";
import DhSubclassForm from "./DhSubclassForm";

/** The create and update actions are Server Actions, so spies here (ADR-0021). */
const meta = {
  component: DhSubclassForm,
  args: {
    onCancel: fn(),
    onSaveFinished: fn(),
    optionBundle: dhOptions,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DhSubclassForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createDhSubclass).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    const submit = canvas.getByRole("button", { name: "Crea sottoclasse" });
    await expect(submit).toBeDisabled();

    await userEvent.type(
      canvas.getByRole("textbox", { name: "Nome" }),
      "Nuovo nome"
    );
    await userEvent.click(submit);

    await waitFor(() =>
      expect(createDhSubclass).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Nuovo nome" })
      )
    );
    await expect(args.onSaveFinished).toHaveBeenCalledOnce();
  },
};

export const Edit: Story = {
  args: { formData: vigil },
  beforeEach: () => {
    mocked(updateDhSubclass).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    const name = canvas.getByRole("textbox", { name: "Nome" });
    await expect(name).toHaveValue(vigil.name);

    await userEvent.clear(name);
    await userEvent.type(name, "Nome nuovo");
    await userEvent.click(
      canvas.getByRole("button", { name: "Modifica sottoclasse" })
    );

    // An edit sends the id and the edited fields only.
    await waitFor(() =>
      expect(updateDhSubclass).toHaveBeenCalledWith({
        id: vigil.id,
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

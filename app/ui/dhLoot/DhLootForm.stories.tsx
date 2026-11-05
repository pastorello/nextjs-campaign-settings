import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { emberTonic } from "@/.storybook/fixtures/daggerheart";
import createDhLoot from "@/app/lib/data/dhLoot/createDhLoot";
import updateDhLoot from "@/app/lib/data/dhLoot/updateDhLoot";
import DhLootForm from "./DhLootForm";

/** The create and update actions are Server Actions, so spies here (ADR-0021). */
const meta = {
  component: DhLootForm,
  args: {
    onCancel: fn(),
    onSaveFinished: fn(),
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DhLootForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createDhLoot).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    const submit = canvas.getByRole("button", { name: "Crea bottino" });
    await expect(submit).toBeDisabled();

    await userEvent.type(
      canvas.getByRole("textbox", { name: "Nome" }),
      "Nuovo nome"
    );
    await userEvent.click(submit);

    await waitFor(() =>
      expect(createDhLoot).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Nuovo nome" })
      )
    );
    await expect(args.onSaveFinished).toHaveBeenCalledOnce();
  },
};

export const Edit: Story = {
  args: { formData: emberTonic },
  beforeEach: () => {
    mocked(updateDhLoot).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    const name = canvas.getByRole("textbox", { name: "Nome" });
    await expect(name).toHaveValue(emberTonic.name);

    await userEvent.clear(name);
    await userEvent.type(name, "Nome nuovo");
    await userEvent.click(
      canvas.getByRole("button", { name: "Salva bottino" })
    );

    // An edit sends the id and the edited fields only.
    await waitFor(() =>
      expect(updateDhLoot).toHaveBeenCalledWith({
        id: emberTonic.id,
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

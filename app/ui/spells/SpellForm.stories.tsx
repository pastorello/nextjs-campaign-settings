import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { frostBlade } from "@/.storybook/fixtures/spells";
import createSpell from "@/app/lib/data/spells/createSpell";
import updateSpell from "@/app/lib/data/spells/updateSpell";
import SpellForm from "./SpellForm";

/**
 * `createSpell` and `updateSpell` are Server Actions, so in Storybook they are
 * spies (ADR-0021): each story sets what the server answers.
 */
const meta = {
  component: SpellForm,
  args: { onCancel: fn(), onSaveFinished: fn() },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof SpellForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createSpell).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    const submit = canvas.getByRole("button", { name: "Crea incantesimo" });
    // Nothing to save until a field is edited.
    await expect(submit).toBeDisabled();

    await userEvent.type(
      canvas.getByRole("textbox", { name: /nome/i }),
      "Lanterna dei dispersi"
    );
    await userEvent.click(submit);

    await waitFor(() =>
      expect(createSpell).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Lanterna dei dispersi" })
      )
    );
    await expect(args.onSaveFinished).toHaveBeenCalledOnce();
  },
};

export const Edit: Story = {
  args: { formData: frostBlade },
  beforeEach: () => {
    mocked(updateSpell).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    const name = canvas.getByRole("textbox", { name: /nome/i });
    await expect(name).toHaveValue(frostBlade.name);

    await userEvent.clear(name);
    await userEvent.type(name, "Lama di galaverna");
    await userEvent.click(
      canvas.getByRole("button", { name: "Modifica incantesimo" })
    );

    // An edit sends the id and the edited fields only.
    await waitFor(() =>
      expect(updateSpell).toHaveBeenCalledWith({
        id: frostBlade.id,
        name: "Lama di galaverna",
      })
    );
  },
};

/** The server refused the payload: the summary lists each field's error. */
export const ServerValidationError: Story = {
  beforeEach: () => {
    mocked(createSpell).mockResolvedValue({
      ok: false,
      errors: { name: [{ key: "tooLong", values: { maximum: 80 } }] },
    });
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: /nome/i }),
      "Un nome troppo lungo"
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Crea incantesimo" })
    );

    await expect(await canvas.findByRole("alert")).toHaveTextContent(
      "Controlla i campi segnalati"
    );
    await expect(args.onSaveFinished).not.toHaveBeenCalled();
  },
};

export const Cancel: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Annulla" }));
    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};

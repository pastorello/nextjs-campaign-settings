import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { saltCrown } from "@/.storybook/fixtures/treasures";
import createTreasure from "@/app/lib/data/treasure/createTreasure";
import updateTreasure from "@/app/lib/data/treasure/updateTreasure";
import TreasureForm from "./TreasureForm";

/** The create and update actions are Server Actions, so spies here (ADR-0021). */
const meta = {
  component: TreasureForm,
  args: { onCancel: fn(), onSaveFinished: fn() },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof TreasureForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createTreasure).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    const submit = canvas.getByRole("button", { name: "Crea tesoro" });
    await expect(submit).toBeDisabled();

    await userEvent.type(
      canvas.getByRole("textbox", { name: /nome/i }),
      "Calice scheggiato"
    );
    await userEvent.click(submit);

    await waitFor(() =>
      expect(createTreasure).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Calice scheggiato" })
      )
    );
    await expect(args.onSaveFinished).toHaveBeenCalledOnce();
  },
};

export const Edit: Story = {
  args: { formData: saltCrown },
  beforeEach: () => {
    mocked(updateTreasure).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    const name = canvas.getByRole("textbox", { name: /nome/i });
    await expect(name).toHaveValue(saltCrown.name);

    await userEvent.clear(name);
    await userEvent.type(name, "Corona di brina");
    await userEvent.click(
      canvas.getByRole("button", { name: "Modifica tesoro" })
    );

    // An edit sends the id and the edited fields only.
    await waitFor(() =>
      expect(updateTreasure).toHaveBeenCalledWith({
        id: saltCrown.id,
        name: "Corona di brina",
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

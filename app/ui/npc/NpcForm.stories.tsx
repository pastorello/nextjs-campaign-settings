import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { aldric } from "@/.storybook/fixtures/npcs";
import createNpc from "@/app/lib/data/npc/createNpc";
import updateNpc from "@/app/lib/data/npc/updateNpc";
import NpcForm from "./NpcForm";

/** The create and update actions are Server Actions, so spies here (ADR-0021). */
const meta = {
  component: NpcForm,
  args: { onCancel: fn(), onSaveFinished: fn() },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof NpcForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createNpc).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    const submit = canvas.getByRole("button", { name: "Crea PNG" });
    await expect(submit).toBeDisabled();

    await userEvent.type(
      canvas.getByRole("textbox", { name: /nome/i }),
      "Berta Collina"
    );
    await userEvent.click(submit);

    await waitFor(() =>
      expect(createNpc).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Berta Collina" })
      )
    );
    await expect(args.onSaveFinished).toHaveBeenCalledOnce();
  },
};

export const Edit: Story = {
  args: { formData: aldric },
  beforeEach: () => {
    mocked(updateNpc).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    const name = canvas.getByRole("textbox", { name: /nome/i });
    await expect(name).toHaveValue(aldric.name);

    await userEvent.clear(name);
    await userEvent.type(name, "Aldric il Vecchio");
    await userEvent.click(canvas.getByRole("button", { name: "Modifica PNG" }));

    // An edit sends the id and the edited fields only.
    await waitFor(() =>
      expect(updateNpc).toHaveBeenCalledWith({
        id: aldric.id,
        name: "Aldric il Vecchio",
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

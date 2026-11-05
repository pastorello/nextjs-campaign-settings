import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { sunblade } from "@/.storybook/fixtures/magicitems";
import createMagicItem from "@/app/lib/data/magicitems/createMagicItem";
import updateMagicItem from "@/app/lib/data/magicitems/updateMagicItem";
import MagicItemForm from "./MagicItemForm";

/** The create and update actions are Server Actions, so spies here (ADR-0021). */
const meta = {
  component: MagicItemForm,
  args: { onCancel: fn(), onSaveFinished: fn() },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MagicItemForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createMagicItem).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    const submit = canvas.getByRole("button", { name: "Crea oggetto magico" });

    await userEvent.type(
      canvas.getByRole("textbox", { name: /nome/i }),
      "Anello del ciottolo"
    );
    await userEvent.click(submit);

    await waitFor(() =>
      expect(createMagicItem).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Anello del ciottolo" })
      )
    );
    await expect(args.onSaveFinished).toHaveBeenCalledOnce();
  },
};

export const Edit: Story = {
  args: { formData: sunblade },
  beforeEach: () => {
    mocked(updateMagicItem).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    const name = canvas.getByRole("textbox", { name: /nome/i });
    await expect(name).toHaveValue(sunblade.name);

    await userEvent.clear(name);
    await userEvent.type(name, "Lama del tramonto");
    await userEvent.click(
      canvas.getByRole("button", { name: "Modifica oggetto magico" })
    );

    // An edit sends the id and the edited fields only.
    await waitFor(() =>
      expect(updateMagicItem).toHaveBeenCalledWith({
        id: sunblade.id,
        name: "Lama del tramonto",
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

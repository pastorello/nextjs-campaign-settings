import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { mapmakers } from "@/.storybook/fixtures/factions";
import createFaction from "@/app/lib/data/faction/createFaction";
import updateFaction from "@/app/lib/data/faction/updateFaction";
import FactionForm from "./FactionForm";

/** The create and update actions are Server Actions, so spies here (ADR-0021). */
const meta = {
  component: FactionForm,
  args: { onCancel: fn(), onSaveFinished: fn() },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof FactionForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createFaction).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    const submit = canvas.getByRole("button", { name: "Crea fazione" });
    await expect(submit).toBeDisabled();

    await userEvent.type(
      canvas.getByRole("textbox", { name: /nome/i }),
      "Fratelli del ponte"
    );
    await userEvent.click(submit);

    await waitFor(() =>
      expect(createFaction).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Fratelli del ponte" })
      )
    );
    await expect(args.onSaveFinished).toHaveBeenCalledOnce();
  },
};

export const Edit: Story = {
  args: { formData: mapmakers },
  beforeEach: () => {
    mocked(updateFaction).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    const name = canvas.getByRole("textbox", { name: /nome/i });
    await expect(name).toHaveValue(mapmakers.name);

    await userEvent.clear(name);
    await userEvent.type(name, "Cartografi riuniti");
    await userEvent.click(
      canvas.getByRole("button", { name: "Modifica fazione" })
    );

    // An edit sends the id and the edited fields only.
    await waitFor(() =>
      expect(updateFaction).toHaveBeenCalledWith({
        id: mapmakers.id,
        name: "Cartografi riuniti",
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

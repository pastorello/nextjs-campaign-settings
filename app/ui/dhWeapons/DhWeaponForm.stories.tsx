import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { harpoon } from "@/.storybook/fixtures/daggerheart";
import createDhWeapon from "@/app/lib/data/dhWeapons/createDhWeapon";
import updateDhWeapon from "@/app/lib/data/dhWeapons/updateDhWeapon";
import DhWeaponForm from "./DhWeaponForm";

/** The create and update actions are Server Actions, so spies here (ADR-0021). */
const meta = {
  component: DhWeaponForm,
  args: {
    onCancel: fn(),
    onSaveFinished: fn(),
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DhWeaponForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createDhWeapon).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    const submit = canvas.getByRole("button", { name: "Crea arma" });
    await expect(submit).toBeDisabled();

    await userEvent.type(
      canvas.getByRole("textbox", { name: "Nome" }),
      "Nuovo nome"
    );
    await userEvent.click(submit);

    await waitFor(() =>
      expect(createDhWeapon).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Nuovo nome" })
      )
    );
    await expect(args.onSaveFinished).toHaveBeenCalledOnce();
  },
};

export const Edit: Story = {
  args: { formData: harpoon },
  beforeEach: () => {
    mocked(updateDhWeapon).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    const name = canvas.getByRole("textbox", { name: "Nome" });
    await expect(name).toHaveValue(harpoon.name);

    await userEvent.clear(name);
    await userEvent.type(name, "Nome nuovo");
    await userEvent.click(canvas.getByRole("button", { name: "Salva arma" }));

    // An edit sends the id and the edited fields only.
    await waitFor(() =>
      expect(updateDhWeapon).toHaveBeenCalledWith({
        id: harpoon.id,
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

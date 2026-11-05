import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, screen, within } from "storybook/test";

import { frostBlade } from "@/.storybook/fixtures/spells";
import ButtonVariant from "./BaseButton/ButtonVariant";
import ModalButton from "./ModalButton";

/**
 * A trigger that opens a dialog holding one of the domain forms (or the
 * delete confirmation). `modalContent` picks the form.
 */
const meta = {
  component: ModalButton,
  args: {
    buttonLabel: "Modifica",
    modalTitle: "Modifica incantesimo",
    modalContent: "spellform",
    componentProps: { formData: frostBlade },
    onSave: fn(),
  },
} satisfies Meta<typeof ModalButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const EditSpell: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Modifica" }));
    await expect(await screen.findByRole("dialog")).toBeVisible();
  },
};

export const DeleteConfirmation: Story = {
  args: {
    buttonLabel: "Elimina",
    buttonVariant: ButtonVariant.danger,
    modalTitle: "Elimina «Lama di brina»",
    modalContent: "deleteform",
    componentProps: {},
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Elimina" }));
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: "Elimina" })
    );
    await expect(args.onSave).toHaveBeenCalledOnce();
  },
};

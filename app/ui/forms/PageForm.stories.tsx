import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import PageForm from "./PageForm";

/**
 * The generic save/cancel footer. With no children it is the delete
 * confirmation `DeleteButton` opens.
 */
const meta = {
  component: PageForm,
  args: { onCancel: fn(), onSaveFinished: fn() },
} satisfies Meta<typeof PageForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DeleteConfirmation: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Elimina" }));
    await expect(args.onSaveFinished).toHaveBeenCalledOnce();
  },
};

export const Deleting: Story = { args: { isSaving: true } };

export const EditingUnchanged: Story = {
  args: { children: <p>I campi del modulo.</p> },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("button", { name: "Salva" })).toBeDisabled();
  },
};

export const EditingWithChanges: Story = {
  args: { children: <p>I campi del modulo.</p>, hasEdits: true },
};

export const SaveFailed: Story = {
  args: {
    children: <p>I campi del modulo.</p>,
    hasEdits: true,
    lastError: { message: "connessione interrotta" },
  },
};

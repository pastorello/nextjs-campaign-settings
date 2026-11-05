import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, screen, waitFor, within } from "storybook/test";

import InlineOrderedList from "./InlineOrderedList";

interface Row {
  id: number;
  name: string;
}

const meta = {
  component: InlineOrderedList<Row>,
  args: {
    items: [
      { id: 1, name: "Primo" },
      { id: 2, name: "Secondo" },
    ],
    copy: {
      title: "Righe",
      addButton: "Aggiungi riga",
      moveUp: (name: string) => `Sposta su ${name}`,
      moveDown: (name: string) => `Sposta giù ${name}`,
    },
    renderItem: (item: Row) => <span>{item.name}</span>,
    renderForm: (item: Row | undefined, onDone: () => void) => (
      <button type="button" onClick={onDone}>
        {item ? `Chiudi ${item.name}` : "Chiudi nuova"}
      </button>
    ),
    reorder: fn(() => Promise.resolve({ ok: true as const })),
    remove: fn(() => Promise.resolve({ ok: true as const })),
  },
} satisfies Meta<typeof InlineOrderedList<Row>>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Primo")).toBeVisible();
    // The first row cannot move up, the last cannot move down.
    await expect(
      canvas.getByRole("button", { name: "Sposta su Primo" })
    ).toBeDisabled();
    await expect(
      canvas.getByRole("button", { name: "Sposta giù Secondo" })
    ).toBeDisabled();
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Aggiungi riga" })
    ).toBeVisible();
    await expect(canvas.queryByRole("listitem")).not.toBeInTheDocument();
  },
};

export const Reorder: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Sposta giù Primo" })
    );
    await waitFor(() => expect(args.reorder).toHaveBeenCalledWith([2, 1]));
  },
};

export const AddAndEdit: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Aggiungi riga" })
    );
    await userEvent.click(canvas.getByRole("button", { name: "Chiudi nuova" }));
    await expect(
      canvas.queryByRole("button", { name: "Chiudi nuova" })
    ).not.toBeInTheDocument();

    await userEvent.click(
      canvas.getByRole("button", { name: "Modifica Primo" })
    );
    await expect(
      canvas.getByRole("button", { name: "Chiudi Primo" })
    ).toBeVisible();
  },
};

/** Deleting asks first; the dialog is in a portal, so it is read from `screen`. */
export const Delete: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Elimina Primo" })
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /elimina/i })
    );
    await waitFor(() => expect(args.remove).toHaveBeenCalledWith(1));
  },
};

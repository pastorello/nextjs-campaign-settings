import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn, screen, userEvent, waitFor } from "storybook/test";

import BaseButton from "../buttons/BaseButton";
import Modal from "./Modal";

/** The app's dialog (Headless UI), animated in and out with framer-motion. */
const meta = {
  component: Modal,
  args: {
    isOpen: true,
    setIsOpen: fn(),
    title: "Elimina «Lama di brina»",
    description: "L'operazione non si può annullare.",
    children: <p>Il contenuto della finestra.</p>,
  },
  argTypes: { size: { control: "inline-radio", options: ["small", "medium"] } },
} satisfies Meta<typeof Modal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  play: async ({ args }) => {
    // The dialog renders in a portal, outside the story's canvas.
    const dialog = await screen.findByRole("dialog");
    await expect(dialog).toHaveTextContent("Elimina «Lama di brina»");
    await userEvent.keyboard("{Escape}");
    await expect(args.setIsOpen).toHaveBeenCalledWith(false);
  },
};

export const Small: Story = { args: { size: "small" } };

/** Opened and closed by its owner's state, as `ModalButton` does. */
export const Controlled: Story = {
  render: function Render(args) {
    const [isOpen, setIsOpen] = useState(false);
    return (
      <>
        <BaseButton onClick={() => setIsOpen(true)}>Apri</BaseButton>
        <Modal {...args} isOpen={isOpen} setIsOpen={setIsOpen} />
      </>
    );
  },
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Apri" }));
    await expect(await screen.findByRole("dialog")).toBeVisible();
    await userEvent.keyboard("{Escape}");
    await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
  },
};

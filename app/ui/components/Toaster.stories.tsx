import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, screen, userEvent, waitFor } from "storybook/test";

import { notifyError, notifySuccess } from "@/app/lib/notifications/notify";
import BaseButton from "../buttons/BaseButton";
import ButtonVariant from "../buttons/BaseButton/ButtonVariant";
import Toaster from "./Toaster";

/**
 * The toast host, mounted once at the root (TD-10). Every story already has
 * one from `.storybook/preview.tsx`; these raise toasts through the same
 * `notify` helpers the app calls.
 */
const meta = {
  component: Toaster,
  // TD-155: Sonner's `richColors` text measures 4.25:1 (success) and 4.34:1
  // (error) on its own backgrounds, just under the 4.5:1 AA floor.
  parameters: { a11y: { test: "todo", context: "body" } },
  render: () => (
    <div className="flex gap-2">
      <BaseButton onClick={() => notifySuccess("Incantesimo salvato")}>
        Successo
      </BaseButton>
      <BaseButton
        variant={ButtonVariant.danger}
        onClick={() => notifyError("Salvataggio non riuscito")}
      >
        Errore
      </BaseButton>
    </div>
  ),
} satisfies Meta<typeof Toaster>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Success: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Successo" }));
    // Sonner slides the toast in; wait for the animation, not just the node.
    const toast = await screen.findByText("Incantesimo salvato");
    await waitFor(() => expect(toast).toBeVisible());
  },
};

export const Error: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Errore" }));
    const toast = await screen.findByText("Salvataggio non riuscito");
    await waitFor(() => expect(toast).toBeVisible());
  },
};

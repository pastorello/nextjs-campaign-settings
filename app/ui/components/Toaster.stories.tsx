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
  // The one place the toast region is checked (see `.storybook/preview.tsx`):
  // TD-155 darkened Sonner's rich-colour text to pass AA.
  parameters: { a11y: { context: "body" } },
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

/**
 * Waits until the toast has finished sliding in. Sonner animates with a CSS
 * transition, which `MotionGlobalConfig.skipAnimations` does not reach; axe
 * measuring a half-faded toast would report a contrast it does not have.
 */
async function toastSettled(text: string) {
  const title = await screen.findByText(text);
  const toast = title.closest("[data-sonner-toast]");
  await waitFor(() => expect(toast).toHaveAttribute("data-mounted", "true"));
  await waitFor(() => expect(getComputedStyle(toast!).opacity).toBe("1"));
  return title;
}

export const Success: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Successo" }));
    await expect(await toastSettled("Incantesimo salvato")).toBeVisible();
  },
};

export const Error: Story = {
  play: async ({ canvas }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Errore" }));
    await expect(await toastSettled("Salvataggio non riuscito")).toBeVisible();
  },
};

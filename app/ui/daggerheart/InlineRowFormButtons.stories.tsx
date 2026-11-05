import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import InlineRowFormButtons from "./InlineRowFormButtons";

const meta = {
  component: InlineRowFormButtons,
  args: { submitLabel: "Salva esperienza", isSaving: false, onCancel: fn() },
} satisfies Meta<typeof InlineRowFormButtons>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Annulla" }));
    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};

/** While saving, cancelling is disabled. */
export const Saving: Story = {
  args: { isSaving: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Annulla" })
    ).toBeDisabled();
  },
};

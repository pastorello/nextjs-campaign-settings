import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import OutlineEditBar from "./OutlineEditBar";

/** The bar over the map while an area's outline is edited (SPEC-024 T5). */
const meta = {
  component: OutlineEditBar,
  args: { title: "Marca di Brina", onSave: fn(), onCancel: fn() },
  // It is positioned over a map, so it needs a box to sit in.
  decorators: [
    (Story) => (
      <div className="relative h-32 w-full bg-gray-200">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof OutlineEditBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Save: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.getByRole("region", { name: "Marca di Brina" })
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Salva contorno" })
    );
    await expect(args.onSave).toHaveBeenCalledOnce();
  },
};

export const Cancel: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Annulla" }));
    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};

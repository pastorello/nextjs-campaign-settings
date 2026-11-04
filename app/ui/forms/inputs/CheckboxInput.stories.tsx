import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import CheckboxInput from "./CheckboxInput";

/** `ControlType.Checkbox`: a boolean field such as a spell's "ritual". */
const meta = {
  component: CheckboxInput,
  args: { label: "Rituale", value: false, onChange: fn() },
} satisfies Meta<typeof CheckboxInput>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("checkbox", { name: "Rituale" }));
    await expect(args.onChange).toHaveBeenCalledWith(true);
  },
};

export const Checked: Story = {
  args: { value: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("checkbox", { name: "Rituale" })
    ).toBeChecked();
  },
};

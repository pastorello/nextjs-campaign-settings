import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import InputComponent from "./InputComponent";

/**
 * The metadata layer's control factory (ADR-0003): given a field name, it
 * renders the control its `PageMeta` declares, with its label. These stories
 * pick one field per control type from the spells domain.
 */
const meta = {
  component: InputComponent,
  args: { setField: fn(), fieldName: "name", value: "" },
  decorators: [
    (Story) => (
      <div className="w-96 pb-48">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof InputComponent>;

export default meta;
type Story = StoryObj<typeof meta>;

export const TextField: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole("textbox", { name: /nome/i }), "L");
    await expect(args.setField).toHaveBeenCalledWith("name", "L");
  },
};

export const SelectField: Story = { args: { fieldName: "level", value: 2 } };

export const CheckboxField: Story = {
  args: { fieldName: "ritual", value: true },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("checkbox")).toBeChecked();
  },
};

export const RichTextField: Story = {
  args: {
    fieldName: "description",
    value: "<p>Un velo di <strong>ghiaccio</strong>.</p>",
  },
};

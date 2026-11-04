import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, screen } from "storybook/test";

import Select from ".";

const options = [
  { value: 0, label: "Trucchetto" },
  { value: 1, label: "1° livello" },
  { value: 2, label: "2° livello" },
  { value: 3, label: "3° livello" },
];

/** `ControlType.Select` and `MultiSelect` (Headless UI Listbox). */
const meta = {
  component: Select,
  args: { label: "Livello", value: 2, onChange: fn(), options },
  decorators: [
    (Story) => (
      <div className="w-64 pb-48">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof Select>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Single: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /livello/i }));
    await userEvent.click(
      await screen.findByRole("option", { name: "3° livello" })
    );
    await expect(args.onChange).toHaveBeenCalledWith(3);
  },
};

export const Multiple: Story = {
  args: { multiple: true, value: [1, 2], label: "Classi" },
};

export const NoLabel: Story = {
  render: ({ label: _label, ...args }) => <Select {...args} />,
};

export const NoOptions: Story = { args: { options: [], value: -1 } };

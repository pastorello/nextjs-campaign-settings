import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import SortOrder from "@/app/lib/definitions/types/SortOrder";
import SortButton from "./SortButton";

/** A column's sort control; it names its column for a screen reader (TD-15). */
const meta = {
  component: SortButton,
  args: {
    sortOrder: SortOrder.asc,
    isActive: false,
    label: "Livello",
    onClick: fn(),
  },
  argTypes: {
    sortOrder: { control: "inline-radio", options: Object.values(SortOrder) },
  },
} satisfies Meta<typeof SortButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Inactive: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const button = canvas.getByRole("button", { name: /livello/i });
    await userEvent.click(button);
    await expect(args.onClick).toHaveBeenCalledOnce();
  },
};

export const Ascending: Story = { args: { isActive: true } };

export const Descending: Story = {
  args: { isActive: true, sortOrder: SortOrder.desc },
};

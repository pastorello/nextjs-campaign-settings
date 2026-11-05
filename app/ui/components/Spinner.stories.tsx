import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import Spinner from "./Spinner";

const meta = {
  component: Spinner,
  argTypes: {
    size: { control: "select", options: [40, 60, 80, 100, 120, 160, 200] },
  },
} satisfies Meta<typeof Spinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Caricamento...")).toBeVisible();
  },
};

/** `size` is a fixed scale of Tailwind steps, not a pixel value (TD-132). */
export const Small: Story = { args: { size: 40 } };

export const OtherColour: Story = { args: { color: "bg-blue-500" } };

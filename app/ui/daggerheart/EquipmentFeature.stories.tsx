import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import EquipmentFeature from "./EquipmentFeature";

const meta = {
  component: EquipmentFeature,
  args: {
    name: "Placca Tiepida",
    text: "<p>Il metallo non è mai freddo.</p>",
  },
} satisfies Meta<typeof EquipmentFeature>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Placca Tiepida")).toBeVisible();
    await expect(canvas.getByText(/non è mai freddo/)).toBeVisible();
  },
};

/** A piece of equipment with no feature draws nothing. */
export const Empty: Story = {
  args: { name: null, text: null },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText("Placca Tiepida")).not.toBeInTheDocument();
  },
};

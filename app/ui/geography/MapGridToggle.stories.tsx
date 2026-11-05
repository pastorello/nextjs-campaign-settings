import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import MapGridToggle from "./MapGridToggle";

/** The grid button beside zoom: it toggles a stored grid, or sets one up. */
const meta = {
  component: MapGridToggle,
  args: {
    isConfigured: true,
    isVisible: false,
    onToggle: fn(),
    onConfigure: fn(),
  },
} satisfies Meta<typeof MapGridToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Hidden: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const toggle = canvas.getByRole("button", { name: "Mostra la griglia" });
    await expect(toggle).toHaveAttribute("aria-pressed", "false");
    await userEvent.click(toggle);
    await expect(args.onToggle).toHaveBeenCalledOnce();
  },
};

export const Visible: Story = {
  args: { isVisible: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Nascondi la griglia" })
    ).toHaveAttribute("aria-pressed", "true");
  },
};

/** Nothing to show yet: the button opens the configuration instead. */
export const NotConfigured: Story = {
  args: { isConfigured: false },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", {
        name: "Griglia non configurata — configurala",
      })
    );
    await expect(args.onConfigure).toHaveBeenCalledOnce();
    await expect(args.onToggle).not.toHaveBeenCalled();
  },
};

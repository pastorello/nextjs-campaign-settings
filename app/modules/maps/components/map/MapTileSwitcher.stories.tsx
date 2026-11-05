import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import { MapTileSwitcher } from "./MapTileSwitcher";

/** Vendored (CLAUDE.md, "unused is not dead"): the base-map layer picker. */
const meta = {
  component: MapTileSwitcher,
  args: { selectedProviderId: "osm", onProviderChange: fn() },
  decorators: [
    (Story) => (
      <div className="relative h-48 w-full bg-gray-300">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MapTileSwitcher>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * TD-165: the main button's `aria-label` ("Tile layer options") does not
 * contain its visible text ("Basic"), `label-content-name-mismatch`. The
 * component is vendored and unwired, so it is not edited here.
 */
export const Default: Story = {
  parameters: { a11y: { test: "todo" } },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Tile layer options" })
    ).toBeVisible();
  },
};

/** Hovering slides out the three layers. */
export const Open: Story = {
  parameters: { a11y: { test: "todo" } },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.hover(
      canvas.getByRole("button", { name: "Tile layer options" })
    );
    const dark = await canvas.findByRole("button", { name: /Dark/ });
    // The slide-out is `pointer-events: none` until a real pointer hovers it,
    // which a headless run does not produce: the click goes straight to it.
    dark.click();
    await expect(args.onProviderChange).toHaveBeenCalledWith("dark");
  },
};

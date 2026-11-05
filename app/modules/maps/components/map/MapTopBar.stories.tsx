import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import { MapTopBar } from "./MapTopBar";

/** Vendored (CLAUDE.md, "unused is not dead"): category pills over the map. */
const meta = {
  component: MapTopBar,
  args: { onCategoryClick: fn() },
  decorators: [
    (Story) => (
      <div className="relative h-24 w-full bg-gray-300">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MapTopBar>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    // The pills show from the `lg` breakpoint up; the runner's viewport is wide.
    await userEvent.click(canvas.getByRole("button", { name: "Hotels" }));
    await expect(args.onCategoryClick).toHaveBeenCalledWith("hotels");
  },
};

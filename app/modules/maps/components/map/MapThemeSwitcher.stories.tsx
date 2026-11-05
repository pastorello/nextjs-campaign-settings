import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";

import { MapThemeSwitcher } from "./MapThemeSwitcher";

/** Vendored (CLAUDE.md, "unused is not dead"): a light/dark toggle for the map. */
const meta = { component: MapThemeSwitcher } satisfies Meta<
  typeof MapThemeSwitcher
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await waitFor(async () =>
      expect(
        await canvas.findByRole("button", {
          name: /Switch to (dark|light) mode/,
        })
      ).toBeVisible()
    );
  },
};

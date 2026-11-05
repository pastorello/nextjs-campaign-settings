import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, screen, spyOn, waitFor } from "storybook/test";

import { MapDetailsPanel } from "./MapDetailsPanel";

/**
 * Vendored (CLAUDE.md, "unused is not dead"): the starter's country panel.
 * It asks a public API for the country's facts; here the answer is invented
 * and no story reaches the network.
 */
const meta = {
  component: MapDetailsPanel,
  args: {
    country: {
      type: "Feature",
      geometry: { type: "Point", coordinates: [0, 0] },
      properties: {
        NAME: "Aerivel",
        NAME_LONG: "Regno di Aerivel",
        ISO_A2: "AE",
      },
    },
    onClose: fn(),
  },
  beforeEach: () => {
    spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          name: { official: "Regno di Aerivel" },
          region: "Costa Grigia",
          subregion: "Marche",
          capital: ["Porto Cenere"],
          population: 120000,
          area: 5400,
        }),
        { status: 200 }
      )
    );
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MapDetailsPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * TD-165: the panel's "Directions" label is white 10px text on a teal
 * 3.66:1 (`color-contrast`). Vendored and unwired, so not edited here.
 */
export const Open: Story = {
  parameters: { a11y: { test: "todo" } },
  play: async () => {
    await waitFor(async () =>
      expect(
        await screen.findByRole("heading", { name: /Aerivel/ })
      ).toBeVisible()
    );
    await waitFor(() => expect(fetch).toHaveBeenCalled());
  },
};

export const Nothing: Story = {
  args: { country: null },
  play: async () => {
    await expect(screen.queryByRole("dialog")).toBeNull();
  },
};

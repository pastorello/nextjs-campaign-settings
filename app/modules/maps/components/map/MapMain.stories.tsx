import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, spyOn, waitFor } from "storybook/test";

import { mockWorld, waitForMap, worldMapUrl } from "@/.storybook/fixtures/maps";
import { MapProvider } from "@/app/modules/maps/contexts/MapContext";
import { MapMain } from "./MapMain";

/**
 * Vendored (CLAUDE.md, "unused is not dead"): the starter's whole map page —
 * search bar, category pills, tile switcher, controls, context menu and the
 * landmark panel on one world map. Nothing in the app mounts it.
 *
 * It asks for tiles from OpenStreetMap, which no story may reach. The
 * component is not edited; the stories instead answer every tile URL Leaflet
 * builds with the one PNG Storybook serves (`getTileUrl` is Leaflet's own
 * hook for it), and the reads its hooks make from the fixtures.
 */
const meta = {
  component: MapMain,
  parameters: { layout: "fullscreen" },
  beforeEach: async () => {
    mockWorld();
    const L = await import("leaflet");
    spyOn(L.TileLayer.prototype, "getTileUrl").mockReturnValue(worldMapUrl);
  },
  decorators: [
    (Story) => (
      <MapProvider>
        <Story />
      </MapProvider>
    ),
  ],
} satisfies Meta<typeof MapMain>;

export default meta;
type Story = StoryObj<typeof meta>;

/** TD-165: `MapTileSwitcher`'s label mismatch, mounted by this page. */
export const Default: Story = {
  parameters: { a11y: { test: "todo" } },
  play: async ({ canvasElement, canvas }) => {
    await waitForMap(canvasElement);
    await waitFor(() =>
      expect(
        canvasElement.querySelector(".leaflet-tile-pane img")
      ).not.toBeNull()
    );
    await expect(
      canvas.getByRole("textbox", { name: "Search countries" })
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Tile layer options" })
    ).toBeVisible();
  },
};

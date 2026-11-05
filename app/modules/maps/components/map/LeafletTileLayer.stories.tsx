import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";

import { MapStage, waitForMap, worldMapUrl } from "@/.storybook/fixtures/maps";
import { LeafletTileLayer } from "./LeafletTileLayer";

/**
 * A tile layer on a real Leaflet map. No tile server in a story: the URL
 * template resolves, query string aside, to the one PNG Storybook serves.
 */
const meta = {
  component: LeafletTileLayer,
  // No attribution text: Leaflet's own "Leaflet" credit then stands alone in
  // its control, whereas beside other text axe flags the link as only
  // distinguishable by colour (`link-in-text-block`).
  args: {
    url: `${worldMapUrl}?z={z}&x={x}&y={y}`,
  },
  render: (args) => (
    <MapStage>
      <LeafletTileLayer {...args} />
    </MapStage>
  ),
} satisfies Meta<typeof LeafletTileLayer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await waitForMap(canvasElement);
    await waitFor(() =>
      expect(
        canvasElement.querySelector(".leaflet-tile-pane img")
      ).not.toBeNull()
    );
  },
};

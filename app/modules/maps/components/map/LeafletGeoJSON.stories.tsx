import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";

import { MapStage, waitForMap } from "@/.storybook/fixtures/maps";
import { LeafletGeoJSON } from "./LeafletGeoJSON";

/** A GeoJSON shape on a real Leaflet map (the stage's pixel space, `CRS.Simple`). */
const meta = {
  component: LeafletGeoJSON,
  args: {
    data: {
      type: "Feature",
      properties: {},
      geometry: {
        type: "Polygon",
        coordinates: [
          [
            [200, 150],
            [500, 150],
            [500, 450],
            [200, 450],
            [200, 150],
          ],
        ],
      },
    },
  },
  render: (args) => (
    <MapStage>
      <LeafletGeoJSON {...args} />
    </MapStage>
  ),
} satisfies Meta<typeof LeafletGeoJSON>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Shape: Story = {
  play: async ({ canvasElement }) => {
    await waitForMap(canvasElement);
    await waitFor(() =>
      expect(
        canvasElement.querySelector(".leaflet-overlay-pane path")
      ).not.toBeNull()
    );
  },
};

export const Nothing: Story = {
  args: { data: null },
  play: async ({ canvasElement }) => {
    await waitForMap(canvasElement);
    await expect(
      canvasElement.querySelector(".leaflet-overlay-pane path")
    ).toBeNull();
  },
};

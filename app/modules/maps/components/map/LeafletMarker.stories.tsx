import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";

import { MapStage, waitForMap } from "@/.storybook/fixtures/maps";
import { LeafletMarker } from "./LeafletMarker";

/** A marker on a real Leaflet map, with a popup. */
const meta = {
  component: LeafletMarker,
  args: { position: [300, 400], popup: "Locanda del Corvo" },
  render: (args) => (
    <MapStage>
      <LeafletMarker {...args} />
    </MapStage>
  ),
} satisfies Meta<typeof LeafletMarker>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement }) => {
    await waitForMap(canvasElement);
    await waitFor(() =>
      expect(
        canvasElement.querySelector(".leaflet-marker-pane img")
      ).not.toBeNull()
    );
  },
};

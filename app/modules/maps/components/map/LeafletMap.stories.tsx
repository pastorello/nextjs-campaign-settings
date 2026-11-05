import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { MapProvider } from "@/app/modules/maps/contexts/MapContext";
import { waitForMap } from "@/.storybook/fixtures/maps";
import { LeafletMap } from "./LeafletMap";

/** The bare Leaflet map every other layer and control mounts on. */
const meta = {
  component: LeafletMap,
  args: { center: [300, 400], zoom: 0, minZoom: -3, maxZoom: 3 },
  render: (args) => (
    <MapProvider>
      <div className="h-96 w-full">
        <LeafletMap {...args} />
      </div>
    </MapProvider>
  ),
} satisfies Meta<typeof LeafletMap>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, canvas }) => {
    await waitForMap(canvasElement);
    await expect(canvas.getByTestId("leaflet-map-container")).toBeVisible();
  },
};

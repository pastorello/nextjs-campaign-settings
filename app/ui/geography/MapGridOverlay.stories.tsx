import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";

import { MapStage, waitForMap, worldMapSize } from "@/.storybook/fixtures/maps";
import GridScale from "@/app/lib/definitions/enums/geography/GridScale";
import MapGridOverlay from "./MapGridOverlay";

/**
 * The grid drawn over a map, and its legend (SPEC-015). It needs a real
 * Leaflet map to draw on, so each story mounts one (`MapStage`).
 */
const meta = {
  component: MapGridOverlay,
  args: {
    isVisible: true,
    gridColumns: 40,
    gridScale: GridScale.Kingdom,
    imageSize: worldMapSize,
  },
  render: (args) => (
    <MapStage>
      <MapGridOverlay {...args} />
    </MapStage>
  ),
} satisfies Meta<typeof MapGridOverlay>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Visible: Story = {
  play: async ({ canvasElement, canvas }) => {
    await waitForMap(canvasElement);
    await waitFor(() =>
      expect(
        canvasElement.querySelector(".leaflet-overlay-pane path")
      ).not.toBeNull()
    );
    await expect(canvas.getByText(/^1 quadretto = /)).toBeVisible();
    await expect(canvas.getByText(/40 × 30 quadretti/)).toBeVisible();
  },
};

export const Hidden: Story = {
  args: { isVisible: false },
  play: async ({ canvasElement, canvas }) => {
    await waitForMap(canvasElement);
    await expect(
      canvasElement.querySelector(".leaflet-overlay-pane path")
    ).toBeNull();
    await expect(canvas.queryByText(/quadretto/)).toBeNull();
  },
};

/** Without a stored grid nothing is drawn — never a guessed one. */
export const NotConfigured: Story = {
  args: { gridColumns: null, gridScale: null },
  play: async ({ canvasElement, canvas }) => {
    await waitForMap(canvasElement);
    await expect(
      canvasElement.querySelector(".leaflet-overlay-pane path")
    ).toBeNull();
    await expect(canvas.queryByText(/quadretto/)).toBeNull();
  },
};

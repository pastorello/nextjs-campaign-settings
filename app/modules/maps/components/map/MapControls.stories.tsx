import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { MapStage, waitForMap } from "@/.storybook/fixtures/maps";
import { MapControls } from "./MapControls";

/**
 * Zoom, reset and fullscreen, in the corner of a map. They act on the real
 * Leaflet map the stage mounts.
 */
const meta = {
  component: MapControls,
  render: (args) => (
    <MapStage>
      <MapControls {...args} />
    </MapStage>
  ),
} satisfies Meta<typeof MapControls>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, canvas, userEvent }) => {
    await waitForMap(canvasElement);
    const zoomIn = canvas.getByRole("button", { name: "Aumenta zoom" });
    await expect(zoomIn).toBeEnabled();
    await userEvent.click(zoomIn);
    await expect(
      canvas.getByRole("button", { name: "Ripristina vista" })
    ).toBeEnabled();
    await expect(
      canvas.getByRole("button", { name: "Attiva schermo intero" })
    ).toBeVisible();
  },
};

/** The slots the geography page fills: a pencil above, a grid toggle below. */
export const WithExtraControls: Story = {
  args: {
    extraControls: <button type="button">Extra sopra</button>,
    belowZoomControls: <button type="button">Extra sotto</button>,
  },
  play: async ({ canvasElement, canvas }) => {
    await waitForMap(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Extra sopra" })
    ).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Extra sotto" })
    ).toBeVisible();
  },
};

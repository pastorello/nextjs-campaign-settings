import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { MapProvider } from "@/app/modules/maps/contexts/MapContext";
import { MapLoadingSpinner } from "./MapLoadingSpinner";

/** The veil over a map that has not finished starting. */
const meta = {
  component: MapLoadingSpinner,
  render: () => (
    <MapProvider>
      <div className="relative h-64 w-full">
        <MapLoadingSpinner />
      </div>
    </MapProvider>
  ),
} satisfies Meta<typeof MapLoadingSpinner>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Loading: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Caricamento della mappa…")).toBeVisible();
  },
};

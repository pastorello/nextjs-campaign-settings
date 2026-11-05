import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, waitFor } from "storybook/test";

import { aerivel, mockWorld, waitForMap } from "@/.storybook/fixtures/maps";
import GeographyExplorer from "./GeographyExplorer";

/**
 * The geography page's map: the root place's pixel map, with its places,
 * landmarks and controls, and the stack that climbs down into a place and
 * back up. Its reads are Server Actions, so spies answered from the
 * fixtures (`mockWorld`, ADR-0021); the map image is a PNG Storybook serves
 * where the app's image route would be.
 */
const meta = {
  component: GeographyExplorer,
  args: { root: aerivel, unpositionedCount: 1, blockedUnpositionedCount: 0 },
  parameters: { layout: "fullscreen" },
  beforeEach: () => {
    mockWorld();
  },
  decorators: [
    (Story) => (
      <div className="h-[40rem] p-4">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof GeographyExplorer>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Root: Story = {
  play: async ({ canvasElement, canvas }) => {
    await waitFor(async () =>
      expect(
        await canvas.findByRole("heading", { name: "Aerivel" })
      ).toBeVisible()
    );
    await waitForMap(canvasElement);
    // The map image is the one `.storybook/public` serves.
    await waitFor(async () => {
      const image = canvasElement.querySelector<HTMLImageElement>(
        ".leaflet-image-layer"
      );
      await expect(image?.naturalWidth).toBe(800);
    });
    // The root has no way up, and the places arrive as markers.
    await expect(canvas.queryByRole("button", { name: "Sali" })).toBeNull();
    await waitFor(() =>
      expect(
        canvasElement.querySelector(".leaflet-marker-pane > *")
      ).not.toBeNull()
    );
  },
};

/** A player's map: the same page with nothing to change. */
export const ReadOnly: Story = {
  args: { readOnly: true },
  play: async ({ canvasElement }) => {
    await waitForMap(canvasElement);
  },
};

/** Click an area, open its map, and climb back out. */
export const Descend: Story = {
  play: async ({ canvasElement, canvas, userEvent }) => {
    await waitForMap(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Marca di Brina" })
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: "Apri mappa" })
    );

    await waitFor(async () =>
      expect(
        await canvas.findByRole("heading", { name: "Marca di Brina" })
      ).toBeVisible()
    );
    await userEvent.click(canvas.getByRole("button", { name: "Sali" }));
    await waitFor(async () =>
      expect(
        await canvas.findByRole("heading", { name: "Aerivel" })
      ).toBeVisible()
    );
  },
};

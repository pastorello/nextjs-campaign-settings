import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, waitFor } from "storybook/test";

import { aerivel, mockWorld, waitForMap } from "@/.storybook/fixtures/maps";
import GridScale from "@/app/lib/definitions/enums/geography/GridScale";
import { MapProvider } from "@/app/modules/maps/contexts/MapContext";
import toStackEntry from "@/app/modules/maps/lib/utils/toStackEntry";
import WorldMap from "./WorldMap";

const root = toStackEntry(aerivel);

/**
 * One place's map, with everything on it: the image, its areas and landmarks,
 * the controls, and the popovers, menus and dialogs they open. It runs the
 * real hooks over a real Leaflet map; their reads are Server Actions, so
 * spies answered from the fixtures (`mockWorld`, ADR-0021).
 */
const meta = {
  component: WorldMap,
  args: {
    parentId: aerivel.id,
    ancestorIds: [aerivel.id],
    placeTitle: aerivel.title,
    parentTitle: "",
    isRoot: true,
    mapUrl: root.mapUrl,
    bounds: root.bounds,
    initialView: root.initialView,
    initialZoom: root.initialZoom,
    gridColumns: null,
    gridScale: null,
    onDescend: fn(),
    onMapChanged: fn(),
    onGridChanged: fn(),
    onDeleted: fn(),
    unpositionedCount: 1,
  },
  parameters: { layout: "fullscreen" },
  beforeEach: () => {
    mockWorld();
  },
  render: (args) => (
    <MapProvider>
      <div className="relative h-[40rem] w-full">
        <WorldMap {...args} />
      </div>
    </MapProvider>
  ),
} satisfies Meta<typeof WorldMap>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The places and landmarks arrive a beat after the map does. */
async function waitForPlaces(canvasElement: HTMLElement) {
  await waitForMap(canvasElement);
  await waitFor(() =>
    expect(canvasElement.querySelector(".custom-poi-marker")).not.toBeNull()
  );
}

export const Default: Story = {
  play: async ({ canvasElement, canvas }) => {
    await waitForPlaces(canvasElement);
    await waitFor(async () =>
      expect(
        await canvas.findByRole("button", { name: "Marca di Brina" })
      ).toBeVisible()
    );
    await expect(
      canvas.getByRole("button", { name: "Locanda del Corvo" })
    ).toBeVisible();
  },
};

/** Click a place: its popover opens over the map. */
export const OpenPlace: Story = {
  play: async ({ canvasElement, canvas, userEvent }) => {
    await waitForPlaces(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Marca di Brina" })
    );
    await waitFor(async () =>
      expect(
        await canvas.findByRole("dialog", { name: "Marca di Brina" })
      ).toBeVisible()
    );
  },
};

/** A stored grid: the toggle draws it, with its legend. */
export const WithGrid: Story = {
  args: { gridColumns: 40, gridScale: GridScale.Kingdom },
  play: async ({ canvasElement, canvas, userEvent }) => {
    await waitForPlaces(canvasElement);
    await userEvent.click(
      await canvas.findByRole("button", { name: "Mostra la griglia" })
    );
    await waitFor(async () =>
      expect(await canvas.findByText(/^1 quadretto = /)).toBeVisible()
    );
  },
};

/** A place with no map of its own: empty ground, and a way to give it one. */
export const NoMap: Story = {
  args: { mapUrl: "", isRoot: false, parentTitle: "Aerivel" },
  play: async ({ canvasElement, canvas }) => {
    await waitForMap(canvasElement);
    await expect(
      canvas.getByRole("button", { name: "Opzioni mappa" })
    ).toBeVisible();
    await expect(
      canvasElement.querySelector(".leaflet-image-layer")
    ).toBeNull();
  },
};

/** A player's map: places and popovers, but no controls that change anything. */
export const ReadOnly: Story = {
  args: { readOnly: true },
  play: async ({ canvasElement, canvas }) => {
    await waitForPlaces(canvasElement);
    await expect(
      canvas.queryByRole("button", { name: "Opzioni mappa" })
    ).toBeNull();
  },
};

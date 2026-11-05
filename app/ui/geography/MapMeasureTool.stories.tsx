import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, waitFor } from "storybook/test";

import { MapStage, waitForMap, worldMapSize } from "@/.storybook/fixtures/maps";
import GridScale from "@/app/lib/definitions/enums/geography/GridScale";
import MapMeasureTool from "./MapMeasureTool";

/**
 * Click, track, click: the distance between two points of the map in the
 * grid's own units (SPEC-015). It listens to a real Leaflet map, so each
 * story mounts one (`MapStage`).
 */
const meta = {
  component: MapMeasureTool,
  args: {
    isActive: true,
    gridColumns: 40,
    gridScale: GridScale.Kingdom,
    imageSize: worldMapSize,
    onExit: fn(),
  },
  render: (args) => (
    <MapStage>
      <MapMeasureTool {...args} />
    </MapStage>
  ),
} satisfies Meta<typeof MapMeasureTool>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {
  play: async ({ args, canvasElement, canvas, userEvent }) => {
    await waitForMap(canvasElement);
    await expect(
      canvas.getByText(
        "Clicca il punto di partenza, poi quello di arrivo — Esc per uscire"
      )
    ).toBeVisible();

    const map = canvasElement.querySelector<HTMLElement>(".leaflet-container");
    if (!map) throw new Error("the map is missing");
    const { left, top } = map.getBoundingClientRect();
    // Leaflet reads `clientX`/`clientY` off the DOM event itself, so the
    // clicks are real `MouseEvent`s at a point of the map.
    const click = (x: number, y: number) => {
      map.dispatchEvent(
        new MouseEvent("click", {
          bubbles: true,
          clientX: left + x,
          clientY: top + y,
        })
      );
    };

    // The tool attaches its listeners once Leaflet's dynamic import resolves,
    // a beat after the map exists; nothing in the DOM says when.
    await new Promise((resolve) => setTimeout(resolve, 300));

    click(100, 100);
    click(300, 100);

    // The second click leaves a marker labelled with the distance.
    await waitFor(() =>
      expect(canvasElement.querySelector(".leaflet-tooltip")).not.toBeNull()
    );

    await userEvent.keyboard("{Escape}");
    await expect(args.onExit).toHaveBeenCalled();
  },
};

export const Exit: Story = {
  play: async ({ args, canvasElement, canvas, userEvent }) => {
    await waitForMap(canvasElement);
    await userEvent.click(
      canvas.getByRole("button", { name: "Esci dalla misurazione" })
    );
    await expect(args.onExit).toHaveBeenCalledOnce();
  },
};

export const Inactive: Story = {
  args: { isActive: false },
  play: async ({ canvasElement, canvas }) => {
    await waitForMap(canvasElement);
    await expect(canvas.queryByText(/Clicca il punto di partenza/)).toBeNull();
  },
};

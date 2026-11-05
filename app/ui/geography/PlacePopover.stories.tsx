import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, screen, waitFor, within } from "storybook/test";

import {
  MapStage,
  locandaDelCorvo,
  marcaDiBrina,
  torreSpezzata,
  waitForMap,
} from "@/.storybook/fixtures/maps";
import fetchEntitiesAtPlace from "@/app/lib/data/maps/fetchEntitiesAtPlace";
import fetchPlaceDeletionImpact from "@/app/lib/data/maps/fetchPlaceDeletionImpact";
import PlacePopover from "./PlacePopover";

/**
 * The card a click on a place opens, positioned over its point on a real
 * Leaflet map (`MapStage`). Its entity list and the dialogs it opens read
 * Server Actions, which are spies here (ADR-0021).
 */
const meta = {
  component: PlacePopover,
  args: {
    target: { kind: "zone", place: marcaDiBrina },
    parentId: 1,
    parentTitle: "Aerivel",
    onClose: fn(),
    onOpenMap: fn(),
    onUnplace: fn(),
    onDeleted: fn(),
    onEditZone: fn(),
    onEditLandmark: fn(),
    onUnplaceLandmark: fn(),
    onDeleteLandmark: fn(),
  },
  beforeEach: () => {
    mocked(fetchEntitiesAtPlace).mockResolvedValue([
      { id: 11, name: "Mirelda Fosca", type: "npc", image: null },
    ]);
    mocked(fetchPlaceDeletionImpact).mockResolvedValue({
      placeCount: 0,
      npcCount: 0,
      deityCount: 0,
    });
  },
  render: (args) => (
    <MapStage>
      <PlacePopover {...args} />
    </MapStage>
  ),
} satisfies Meta<typeof PlacePopover>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The popover waits for the map: it is placed from the map's own pixels. */
async function popover(canvasElement: HTMLElement, name: string) {
  await waitForMap(canvasElement);
  return await within(canvasElement).findByRole("dialog", { name });
}

export const Zone: Story = {
  play: async ({ canvasElement, canvas }) => {
    await popover(canvasElement, "Marca di Brina");
    await waitFor(async () =>
      expect(await canvas.findByText("Mirelda Fosca")).toBeVisible()
    );
    await expect(canvas.getByText(/Una costa battuta dal vento/)).toBeVisible();
  },
};

export const OpenMap: Story = {
  play: async ({ args, canvasElement, canvas, userEvent }) => {
    await popover(canvasElement, "Marca di Brina");
    await userEvent.click(canvas.getByRole("button", { name: "Apri mappa" }));
    await expect(args.onOpenMap).toHaveBeenCalledWith(marcaDiBrina);
  },
};

/** No map of its own yet: the button is disabled, with the reason. */
export const WithoutMap: Story = {
  args: { target: { kind: "zone", place: torreSpezzata } },
  play: async ({ canvasElement, canvas }) => {
    await popover(canvasElement, "Torre Spezzata");
    await expect(
      canvas.getByRole("button", { name: "Apri mappa" })
    ).toBeDisabled();
    await expect(
      canvas.getByText("Questo luogo non ha ancora una mappa.")
    ).toBeVisible();
  },
};

export const Edit: Story = {
  play: async ({ args, canvasElement, canvas, userEvent }) => {
    await popover(canvasElement, "Marca di Brina");
    await userEvent.click(canvas.getByRole("button", { name: "Modifica" }));
    await expect(args.onEditZone).toHaveBeenCalledWith(marcaDiBrina);
  },
};

export const Landmark: Story = {
  args: { target: { kind: "poi", poi: locandaDelCorvo, poiId: 5 } },
  play: async ({ args, canvasElement, canvas, userEvent }) => {
    await popover(canvasElement, "Locanda del Corvo");
    await waitFor(() =>
      expect(fetchEntitiesAtPlace).toHaveBeenCalledWith({ poiId: 5 })
    );
    await userEvent.click(canvas.getByRole("button", { name: "Modifica" }));
    await expect(args.onEditLandmark).toHaveBeenCalledWith(locandaDelCorvo);
    // A landmark has no map to open.
    await expect(
      canvas.queryByRole("button", { name: "Apri mappa" })
    ).toBeNull();
  },
};

/** "Rimuovi" opens the dialog that asks take-off-the-map or delete. */
export const Remove: Story = {
  play: async ({ canvasElement, canvas, userEvent }) => {
    await popover(canvasElement, "Marca di Brina");
    await userEvent.click(canvas.getByRole("button", { name: "Rimuovi" }));
    await waitFor(async () =>
      expect(
        await screen.findByRole("dialog", {
          name: "Rimuovere «Marca di Brina»?",
        })
      ).toBeVisible()
    );
  },
};

/** A player's popover: the description, who is here, and "Apri mappa". */
export const ReadOnly: Story = {
  args: { readOnly: true },
  play: async ({ canvasElement, canvas }) => {
    await popover(canvasElement, "Marca di Brina");
    await expect(
      canvas.getByRole("button", { name: "Apri mappa" })
    ).toBeEnabled();
    await expect(canvas.queryByRole("button", { name: "Rimuovi" })).toBeNull();
    await expect(canvas.queryByRole("button", { name: "Modifica" })).toBeNull();
  },
};

export const Close: Story = {
  play: async ({ args, canvasElement, canvas, userEvent }) => {
    await popover(canvasElement, "Marca di Brina");
    await userEvent.click(canvas.getByRole("button", { name: "Chiudi" }));
    await expect(args.onClose).toHaveBeenCalled();
  },
};

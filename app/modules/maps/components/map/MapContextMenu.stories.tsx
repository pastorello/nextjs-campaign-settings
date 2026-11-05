import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import { MapContextMenu } from "./MapContextMenu";

/**
 * The right-click menu over the map. It takes every label as a prop (the
 * module stays free of the app's catalogue), so these stories pass Italian
 * copy the way `WorldMap` does.
 */
const meta = {
  component: MapContextMenu,
  args: {
    isOpen: true,
    position: { x: 200, y: 120, latlng: { lat: 300, lng: 400 } },
    onClose: fn(),
    onAddMarker: fn(),
    onStartMeasurement: fn(),
    onAddPOI: fn(),
    ariaLabel: "Menu contestuale della mappa",
    addMarkerLabel: "Aggiungi un marker temporaneo",
    addMarkerSublabel: "Scompare al ricaricamento della pagina",
    measureLabel: "Misura",
    measureSublabel: "Avvia la misurazione della distanza",
    addPlaceLabel: "Aggiungi luogo",
    addPlaceSublabel: "Crea un luogo qui",
  },
  // TD-166: the panel is `role="menu"` but holds plain buttons (and the
  // filter input), `aria-required-children`; the picker's group headings are
  // `gray-400` on white, 2.6:1 (`color-contrast`).
  parameters: { layout: "fullscreen", a11y: { test: "todo" } },
} satisfies Meta<typeof MapContextMenu>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.getByRole("menu", { name: "Menu contestuale della mappa" })
    ).toBeVisible();
    await userEvent.click(canvas.getByRole("button", { name: /Misura/ }));
    await expect(args.onStartMeasurement).toHaveBeenCalledOnce();
  },
};

export const AddPlace: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: /Aggiungi luogo/ })
    );
    await expect(args.onAddPOI).toHaveBeenCalledWith(300, 400);
  },
};

/** Over an area that has a map of its own, a place cannot be added here. */
export const OverAnArea: Story = {
  args: { hideAddPlace: true },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole("button", { name: /Aggiungi luogo/ })
    ).toBeNull();
    await expect(canvas.getByRole("button", { name: /Misura/ })).toBeVisible();
  },
};

/** Closed: nothing renders. */
export const Closed: Story = {
  args: { isOpen: false },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("menu")).toBeNull();
  },
};

const pool = {
  unplacedHere: [{ key: "zone-8", title: "Faro Dimenticato" }],
  unplacedElsewhere: [
    { key: "zone-9", title: "Porto Cenere", sublabel: "da «Marca di Brina»" },
  ],
  onPositionPlace: fn(),
  onAddPlaceNamed: fn(),
  positionPlaceLabel: "Posiziona luogo",
  positionPlaceHereLabel: "Su questa mappa",
  positionPlaceElsewhereLabel: "Da altre mappe",
  positionPlaceFilterPlaceholder: "Filtra per nome",
  positionPlaceNoMatchesLabel: "Nessun luogo corrisponde.",
  positionPlaceCreateLabel: (title: string) => `Aggiungi «${title}» qui`,
};

/** Places with no position yet, here and from other maps, to put at this point. */
export const PositionAPlace: Story = {
  args: pool,
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: /Posiziona luogo/ })
    );
    await userEvent.click(
      await canvas.findByRole("button", { name: /Faro Dimenticato/ })
    );
    await expect(args.onPositionPlace).toHaveBeenCalledWith("zone-8", 300, 400);
  },
};

/** A name that matches nothing can be created on the spot (SPEC-026). */
export const CreateNamed: Story = {
  args: pool,
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: /Posiziona luogo/ })
    );
    await userEvent.type(
      await canvas.findByRole("searchbox", { name: "Filtra per nome" }),
      "Torre Nuova"
    );
    await expect(canvas.getByText("Nessun luogo corrisponde.")).toBeVisible();
    await userEvent.click(
      canvas.getByRole("button", { name: "Aggiungi «Torre Nuova» qui" })
    );
    await expect(args.onAddPlaceNamed).toHaveBeenCalledWith(
      "Torre Nuova",
      300,
      400
    );
  },
};

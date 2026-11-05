import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, screen, waitFor } from "storybook/test";

import { locandaDelCorvo, worldMapCorners } from "@/.storybook/fixtures/maps";
import { MapPOIPanel } from "./MapPOIPanel";

/**
 * The drawer that lists the landmarks of a map and adds or edits a place
 * (SPEC-002, SPEC-004). It renders in a portal, so the stories look in
 * `screen`. Its callbacks are the map's own, so spies here.
 */
const meta = {
  component: MapPOIPanel,
  args: {
    isOpen: true,
    onClose: fn(),
    pois: [
      locandaDelCorvo,
      {
        ...locandaDelCorvo,
        id: "poi-6",
        title: "Tempio del Faro",
        description: "Un piccolo tempio accanto al faro spento.",
        category: "religion",
      },
    ],
    onAddPOI: fn(),
    onUpdatePOI: fn(),
    onDeletePOI: fn(),
    onClearAll: fn(),
    onExport: fn(),
    onImport: fn(),
    onFlyTo: fn(),
    onAddPlace: fn(() => Promise.resolve({ ok: true })),
    mapCorners: worldMapCorners,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof MapPOIPanel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {
  play: async ({ args, userEvent }) => {
    await waitFor(async () =>
      expect(await screen.findByText("Locanda del Corvo")).toBeVisible()
    );
    await expect(screen.getByText("Tempio del Faro")).toBeVisible();
    await userEvent.click(
      screen.getAllByRole("button", { name: "Vai a questa posizione" })[0]!
    );
    await expect(args.onFlyTo).toHaveBeenCalledWith(locandaDelCorvo);
  },
};

/**
 * TD-167, three findings in this panel: the empty state's subtitle is
 * `gray-400` on white, 2.6:1 (`color-contrast`); and the form's kind and
 * category `<select>`s have a `<label>` with no `htmlFor`, so no accessible
 * name (`select-name`) — which `Add` and `Edit` below hit.
 */
export const Empty: Story = {
  parameters: { a11y: { test: "todo" } },
  args: { pois: [] },
  play: async () => {
    await waitFor(async () =>
      expect(await screen.findByText("Nessun luogo")).toBeVisible()
    );
  },
};

export const Add: Story = {
  parameters: { a11y: { test: "todo" } }, // TD-167
  args: { mode: "add" },
  play: async () => {
    await waitFor(async () =>
      expect(await screen.findByText("Aggiungi luogo")).toBeVisible()
    );
    await expect(
      screen.getByPlaceholderText("Inserisci il nome del luogo")
    ).toBeVisible();
  },
};

export const Edit: Story = {
  parameters: { a11y: { test: "todo" } }, // TD-167
  args: { mode: "edit", editTarget: locandaDelCorvo },
  play: async () => {
    await waitFor(async () =>
      expect(await screen.findByText("Modifica luogo")).toBeVisible()
    );
    await expect(
      screen.getByPlaceholderText("Inserisci il nome del luogo")
    ).toHaveValue("Locanda del Corvo");
  },
};

export const Closed: Story = { args: { isOpen: false } };

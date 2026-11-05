import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, screen, spyOn, waitFor } from "storybook/test";

import updateZoneMap from "@/app/lib/data/maps/updateZoneMap";
import MapUploadControl from "./MapUploadControl";

/**
 * Gives a place a map, or replaces its map. The upload goes through `fetch`,
 * the save is a Server Action (a spy, ADR-0021).
 */
const meta = {
  component: MapUploadControl,
  // TD-161: the upload dialog has no accessible name (`title=""`), so axe
  // fails every story that opens it.
  parameters: { a11y: { test: "todo" } },
  args: {
    placeId: 7,
    hasMap: false,
    isOpen: true,
    onClose: fn(),
    onMapChanged: fn(),
  },
  beforeEach: () => {
    spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(JSON.stringify({ id: "map-2" }), { status: 200 })
    );
    mocked(updateZoneMap).mockResolvedValue({ ok: true });
  },
} satisfies Meta<typeof MapUploadControl>;

export default meta;
type Story = StoryObj<typeof meta>;

const file = new File(["x"], "marca.png", { type: "image/png" });

async function pickFile(userEvent: {
  upload: (el: HTMLElement, f: File) => Promise<void>;
}) {
  await screen.findByRole("dialog");
  await userEvent.upload(screen.getByLabelText(/mappa/i), file);
}

export const Upload: Story = {
  play: async ({ args, userEvent }) => {
    await pickFile(userEvent);
    await userEvent.click(
      screen.getByRole("button", { name: "Carica la mappa" })
    );

    await waitFor(() =>
      expect(updateZoneMap).toHaveBeenCalledWith({ id: 7, mapImage: "map-2" })
    );
    await expect(args.onMapChanged).toHaveBeenCalledWith("map-2");
  },
};

/** Replacing asks first: the places already on the map keep their coordinates. */
export const Replace: Story = {
  args: { hasMap: true },
  play: async ({ args, userEvent }) => {
    await pickFile(userEvent);
    await userEvent.click(
      screen.getByRole("button", { name: "Sostituisci la mappa" })
    );
    await waitFor(async () =>
      expect(
        await screen.findByRole("dialog", { name: "Sostituire la mappa?" })
      ).toBeVisible()
    );
    await expect(updateZoneMap).not.toHaveBeenCalled();

    await userEvent.click(screen.getByRole("button", { name: "Sostituisci" }));
    await waitFor(() =>
      expect(args.onMapChanged).toHaveBeenCalledWith("map-2")
    );
  },
};

export const UploadFailed: Story = {
  beforeEach: () => {
    spyOn(globalThis, "fetch").mockResolvedValue(
      new Response("no", { status: 500 })
    );
  },
  play: async ({ args, userEvent }) => {
    await pickFile(userEvent);
    await userEvent.click(
      screen.getByRole("button", { name: "Carica la mappa" })
    );

    await waitFor(() => expect(fetch).toHaveBeenCalled());
    await expect(updateZoneMap).not.toHaveBeenCalled();
    await expect(args.onMapChanged).not.toHaveBeenCalled();
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";

import { portrait } from "@/.storybook/fixtures/images";
import fetchEntitiesAtPlace from "@/app/lib/data/maps/fetchEntitiesAtPlace";
import assignNpcLocation from "@/app/lib/data/npc/assignLocation";
import PlaceEntityList from "./PlaceEntityList";

/**
 * The characters at a place, in its popover. The read and the detach are
 * Server Actions, so spies here (ADR-0021).
 */
const meta = {
  component: PlaceEntityList,
  args: { target: { zoneId: 2 } },
  beforeEach: () => {
    mocked(fetchEntitiesAtPlace).mockResolvedValue([
      { id: 11, name: "Mirelda Fosca", type: "npc", image: null },
      { id: 21, name: "Helios", type: "deity", image: null },
    ]);
  },
} satisfies Meta<typeof PlaceEntityList>;

export default meta;
type Story = StoryObj<typeof meta>;

/**
 * With a portrait. TD-162: the thumbnail's alt text repeats the name beside
 * it, which axe flags (`image-redundant-alt`).
 */
export const Listed: Story = {
  parameters: { a11y: { test: "todo" } },
  beforeEach: () => {
    mocked(fetchEntitiesAtPlace).mockResolvedValue([
      { id: 11, name: "Mirelda Fosca", type: "npc", image: portrait },
      { id: 21, name: "Helios", type: "deity", image: null },
    ]);
  },
  play: async ({ canvas }) => {
    await waitFor(async () =>
      expect(await canvas.findByText("Mirelda Fosca")).toBeVisible()
    );
    await expect(fetchEntitiesAtPlace).toHaveBeenCalledWith({ zoneId: 2 });
  },
};

export const Landmark: Story = {
  args: { target: { poiId: 5 } },
  play: async ({ canvas }) => {
    await canvas.findByText("Mirelda Fosca");
    await expect(fetchEntitiesAtPlace).toHaveBeenCalledWith({ poiId: 5 });
  },
};

export const Empty: Story = {
  beforeEach: () => {
    mocked(fetchEntitiesAtPlace).mockResolvedValue([]);
  },
  play: async ({ canvas }) => {
    await waitFor(async () =>
      expect(
        await canvas.findByText(
          "Nessun personaggio o divinità in questo luogo."
        )
      ).toBeVisible()
    );
  },
};

export const Detach: Story = {
  beforeEach: () => {
    mocked(assignNpcLocation).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await canvas.findByText("Mirelda Fosca");
    await userEvent.click(
      canvas.getByRole("button", { name: /Mirelda Fosca/ })
    );

    await waitFor(() =>
      expect(assignNpcLocation).toHaveBeenCalledWith({
        id: 11,
        zoneId: null,
        poiId: null,
      })
    );
    await waitFor(() => expect(canvas.queryByText("Mirelda Fosca")).toBeNull());
  },
};

/** A player's map: the same list, with nothing to detach. */
export const ReadOnly: Story = {
  args: { readOnly: true },
  play: async ({ canvas }) => {
    await canvas.findByText("Mirelda Fosca");
    await expect(canvas.queryByRole("button")).toBeNull();
  },
};

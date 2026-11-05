import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, screen, waitFor } from "storybook/test";

import deletePlace from "@/app/lib/data/maps/deletePlace";
import fetchPlaceDeletionImpact from "@/app/lib/data/maps/fetchPlaceDeletionImpact";
import RemovePlaceDialog from "./RemovePlaceDialog";

/**
 * "Rimuovi" for a place: with `onUnplace` it offers the two outcomes,
 * without it a plain deletion (the map's "Elimina questa mappa"). Both
 * actions are Server Actions, so spies here (ADR-0021).
 */
const meta = {
  component: RemovePlaceDialog,
  args: {
    placeId: 3,
    placeTitle: "Marca di Brina",
    parentTitle: "Aerivel",
    isRoot: false,
    isOpen: true,
    onClose: fn(),
    onDeleted: fn(),
  },
  beforeEach: () => {
    mocked(fetchPlaceDeletionImpact).mockResolvedValue({
      placeCount: 2,
      npcCount: 1,
      deityCount: 0,
    });
    mocked(deletePlace).mockResolvedValue(undefined);
  },
} satisfies Meta<typeof RemovePlaceDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The map's own delete: one outcome, so one confirmation. */
export const Confirm: Story = {
  play: async ({ args, userEvent }) => {
    await screen.findByRole("dialog", { name: "Eliminare «Marca di Brina»?" });
    await waitFor(async () =>
      expect(await screen.findByText(/2 luoghi passeranno/)).toBeVisible()
    );

    await userEvent.click(screen.getByRole("button", { name: "Elimina" }));
    await waitFor(() => expect(deletePlace).toHaveBeenCalledWith(3));
    await expect(args.onDeleted).toHaveBeenCalledOnce();
  },
};

export const NoImpact: Story = {
  beforeEach: () => {
    mocked(fetchPlaceDeletionImpact).mockResolvedValue({
      placeCount: 0,
      npcCount: 0,
      deityCount: 0,
    });
  },
  play: async () => {
    await waitFor(async () =>
      expect(await screen.findByText(/Nessuna conseguenza/)).toBeVisible()
    );
  },
};

/** From a place's popover: take it off the map, or delete it. */
export const Choice: Story = {
  args: { onUnplace: fn() },
  play: async ({ args, userEvent }) => {
    await screen.findByRole("dialog", { name: "Rimuovere «Marca di Brina»?" });
    await userEvent.click(
      await screen.findByRole("radio", { name: "Rimuovi dalla mappa" })
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Rimuovi dalla mappa" })
    );
    await expect(args.onUnplace).toHaveBeenCalledOnce();
    await expect(deletePlace).not.toHaveBeenCalled();
  },
};

export const DeleteFromChoice: Story = {
  args: { onUnplace: fn() },
  play: async ({ args, userEvent }) => {
    await userEvent.click(
      await screen.findByRole("radio", { name: "Elimina definitivamente" })
    );
    await userEvent.click(screen.getByRole("button", { name: "Elimina" }));
    await waitFor(() => expect(deletePlace).toHaveBeenCalledWith(3));
    await expect(args.onDeleted).toHaveBeenCalledOnce();
  },
};

/** The root has no "delete this map" (SPEC-010, rule 1): nothing renders. */
export const Root: Story = {
  args: { isRoot: true },
  play: async () => {
    await expect(screen.queryByRole("dialog")).toBeNull();
  },
};

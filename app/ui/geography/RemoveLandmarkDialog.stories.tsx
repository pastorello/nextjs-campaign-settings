import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, screen, waitFor } from "storybook/test";

import fetchLandmarkDeletionImpact from "@/app/lib/data/maps/fetchLandmarkDeletionImpact";
import RemoveLandmarkDialog from "./RemoveLandmarkDialog";

/**
 * "Rimuovi" for a landmark: take it off the map, or delete it, with what the
 * deletion costs read first (SPEC-023). The count is a Server Action, so a
 * spy here (ADR-0021).
 */
const meta = {
  component: RemoveLandmarkDialog,
  args: {
    landmarkId: 5,
    landmarkTitle: "Locanda del Corvo",
    parentTitle: "Marca di Brina",
    isOpen: true,
    onClose: fn(),
    onUnplace: fn(),
    onDelete: fn(),
  },
  beforeEach: () => {
    mocked(fetchLandmarkDeletionImpact).mockResolvedValue({
      npcCount: 2,
      deityCount: 0,
    });
  },
} satisfies Meta<typeof RemoveLandmarkDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

const title = "Rimuovere «Locanda del Corvo»?";

export const Impact: Story = {
  play: async () => {
    await screen.findByRole("dialog", { name: title });
    await waitFor(async () =>
      expect(await screen.findByText(/2 PNG restano/)).toBeVisible()
    );
    // Nothing is chosen yet, so nothing can be confirmed.
    await expect(
      screen.getByRole("button", { name: "Elimina" })
    ).toBeDisabled();
  },
};

export const NoCharacters: Story = {
  beforeEach: () => {
    mocked(fetchLandmarkDeletionImpact).mockResolvedValue({
      npcCount: 0,
      deityCount: 0,
    });
  },
  play: async () => {
    await waitFor(async () =>
      expect(
        await screen.findByText(/Nessun personaggio è collegato/)
      ).toBeVisible()
    );
  },
};

export const Unplace: Story = {
  play: async ({ args, userEvent }) => {
    await userEvent.click(
      await screen.findByRole("radio", { name: "Rimuovi dalla mappa" })
    );
    await userEvent.click(
      screen.getByRole("button", { name: "Rimuovi dalla mappa" })
    );
    await expect(args.onUnplace).toHaveBeenCalledOnce();
    await expect(args.onDelete).not.toHaveBeenCalled();
  },
};

export const Delete: Story = {
  play: async ({ args, userEvent }) => {
    await userEvent.click(
      await screen.findByRole("radio", { name: "Elimina definitivamente" })
    );
    await userEvent.click(screen.getByRole("button", { name: "Elimina" }));
    await expect(args.onDelete).toHaveBeenCalledOnce();
    await expect(args.onUnplace).not.toHaveBeenCalled();
  },
};

export const Cancel: Story = {
  play: async ({ args, userEvent }) => {
    await screen.findByRole("dialog");
    await userEvent.click(screen.getByRole("button", { name: "Annulla" }));
    await expect(args.onClose).toHaveBeenCalled();
  },
};

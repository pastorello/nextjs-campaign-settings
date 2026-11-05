import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, screen, waitFor, within } from "storybook/test";

import {
  adventures,
  copyDestinations,
  progress,
} from "@/.storybook/fixtures/campaigns";
import deleteAdventureById from "@/app/lib/data/campaigns/deleteAdventureById";
import reorderAdventures from "@/app/lib/data/campaigns/reorderAdventures";
import AdventureLadder from "./AdventureLadder";

/** A campaign's adventures in order, with progress, status and copy (SPEC-013 §5.2). */
const meta = {
  component: AdventureLadder,
  args: { campaignId: 1, adventures, progress, copyDestinations },
} satisfies Meta<typeof AdventureLadder>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Il Passo Spezzato")).toBeVisible();
    await expect(canvas.getByText("2/4 scene")).toBeVisible();
    // The first row cannot move up, the last cannot move down.
    await expect(
      canvas.getByRole("button", { name: 'Sposta "Il Passo Spezzato" in alto' })
    ).toBeDisabled();
    await expect(
      canvas.getByRole("button", { name: 'Sposta "Il Faro Spento" in basso' })
    ).toBeDisabled();
  },
};

export const Empty: Story = {
  args: { adventures: [], progress: {} },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Nessuna avventura ancora/)).toBeVisible();
  },
};

export const Reorder: Story = {
  beforeEach: () => {
    mocked(reorderAdventures).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", {
        name: 'Sposta "Il Passo Spezzato" in basso',
      })
    );
    await waitFor(() =>
      expect(reorderAdventures).toHaveBeenCalledWith(1, [6, 5, 8])
    );
  },
};

export const AddOpensForm: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Aggiungi avventura" })
    );
    await expect(
      await canvas.findByRole("textbox", { name: "Titolo" })
    ).toBeVisible();
  },
};

export const Delete: Story = {
  beforeEach: () => {
    mocked(deleteAdventureById).mockResolvedValue(undefined);
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getAllByRole("button", { name: /Elimina/ })[0]!
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /elimina/i })
    );
    await waitFor(() => expect(deleteAdventureById).toHaveBeenCalledWith(5));
  },
};

export const CopyOpensDialog: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getAllByRole("button", { name: /Copia in/ })[0]!
    );
    await expect(
      await screen.findByRole("dialog", { name: /Copia/ })
    ).toBeVisible();
  },
};

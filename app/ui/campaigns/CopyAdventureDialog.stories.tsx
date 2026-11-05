import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, screen, waitFor } from "storybook/test";

import { adventure, copyDestinations } from "@/.storybook/fixtures/campaigns";
import copyAdventure from "@/app/lib/data/campaigns/copyAdventure";
import CopyAdventureDialog from "./CopyAdventureDialog";

/** "Copia in…" (SPEC-032 §5.4): which campaign receives the copy. */
const meta = {
  component: CopyAdventureDialog,
  args: {
    adventure: { id: adventure.id, title: adventure.title },
    destinations: copyDestinations,
    allowStandalone: true,
    system: "dnd5e",
    onClose: fn(),
  },
  // The dialog is a modal in a portal.
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof CopyAdventureDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  beforeEach: () => {
    mocked(copyAdventure).mockResolvedValue({ ok: true, id: 40 });
  },
  play: async ({ args, userEvent }) => {
    await userEvent.click(await screen.findByRole("button", { name: "Copia" }));
    await waitFor(() =>
      expect(copyAdventure).toHaveBeenCalledWith({
        adventureId: adventure.id,
        destinationCampaignId: 2,
      })
    );
    await waitFor(() => expect(args.onClose).toHaveBeenCalledOnce());
  },
};

export const NoDestination: Story = {
  args: { destinations: [], allowStandalone: false },
  play: async () => {
    await expect(
      await screen.findByText(/Nessun'altra campagna/)
    ).toBeInTheDocument();
    await expect(screen.getByRole("button", { name: "Copia" })).toBeDisabled();
  },
};

export const Cancel: Story = {
  play: async ({ args, userEvent }) => {
    await userEvent.click(
      await screen.findByRole("button", { name: "Annulla" })
    );
    await expect(args.onClose).toHaveBeenCalledOnce();
  },
};

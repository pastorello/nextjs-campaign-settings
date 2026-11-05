import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, screen, waitFor } from "storybook/test";

import fetchPlaceReveals from "@/app/lib/data/visibility/fetchPlaceReveals";
import setPlaceReveal from "@/app/lib/data/visibility/setPlaceReveal";
import PlaceRevealDialog from "./PlaceRevealDialog";

/**
 * Which campaigns see a place (SPEC-022 T7). The read and the write are
 * Server Actions, so spies here (ADR-0021).
 */
const meta = {
  component: PlaceRevealDialog,
  args: {
    kind: "zone",
    placeId: 2,
    title: "Marca di Brina",
    isOpen: true,
    onClose: fn(),
  },
  beforeEach: () => {
    mocked(fetchPlaceReveals).mockResolvedValue({
      campaigns: [
        { id: 1, title: "Le Maree di Aerivel", revealed: true, hiddenBy: null },
        { id: 2, title: "Ombre sul Faro", revealed: false, hiddenBy: null },
      ],
    });
    mocked(setPlaceReveal).mockResolvedValue({ ok: true });
  },
} satisfies Meta<typeof PlaceRevealDialog>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Campaigns: Story = {
  play: async () => {
    await screen.findByRole("dialog", { name: "Chi vede «Marca di Brina»" });
    await expect(
      await screen.findByRole("checkbox", { name: "Le Maree di Aerivel" })
    ).toBeChecked();
    await expect(
      screen.getByRole("checkbox", { name: "Ombre sul Faro" })
    ).not.toBeChecked();
  },
};

export const Reveal: Story = {
  play: async ({ userEvent }) => {
    await userEvent.click(
      await screen.findByRole("checkbox", { name: "Ombre sul Faro" })
    );
    await waitFor(() =>
      expect(setPlaceReveal).toHaveBeenCalledWith({
        kind: "zone",
        id: 2,
        campaignId: 2,
        revealed: true,
      })
    );
  },
};

/** Revealed to a campaign, yet a place that contains it is still hidden. */
export const HiddenByAnAncestor: Story = {
  beforeEach: () => {
    mocked(fetchPlaceReveals).mockResolvedValue({
      campaigns: [
        {
          id: 1,
          title: "Le Maree di Aerivel",
          revealed: true,
          hiddenBy: "Aerivel",
        },
      ],
    });
  },
  play: async () => {
    await waitFor(async () =>
      expect(
        await screen.findByText(/Ancora nascosto da «Aerivel»/)
      ).toBeVisible()
    );
  },
};

export const NoCampaigns: Story = {
  beforeEach: () => {
    mocked(fetchPlaceReveals).mockResolvedValue({ campaigns: [] });
  },
  play: async () => {
    await waitFor(async () =>
      expect(await screen.findByText(/Nessuna campagna ancora/)).toBeVisible()
    );
  },
};

export const Close: Story = {
  play: async ({ args, userEvent }) => {
    await screen.findByRole("dialog");
    await userEvent.click(screen.getByRole("button", { name: "Chiudi" }));
    await expect(args.onClose).toHaveBeenCalled();
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, screen, userEvent, waitFor } from "storybook/test";

import fetchLinkableEntities from "@/app/lib/data/maps/fetchLinkableEntities";
import fetchZones from "@/app/lib/data/maps/fetchZones";
import fetchZoneLandmarks from "@/app/lib/data/maps/fetchZoneLandmarks";
import AttachEntityButton from "./AttachEntityButton";

/**
 * The map's way to attach an existing character to the zone in view: pick a
 * type, then the entity, then hand off to the assignment modal. Every step
 * reads from a Server Action, so each is a spy here (ADR-0021).
 */
const meta = {
  component: AttachEntityButton,
  args: { zoneId: 1, isOpen: true, onClose: fn(), onAttached: fn() },
  beforeEach: () => {
    mocked(fetchLinkableEntities).mockResolvedValue([
      { id: 11, name: "Mirelda Fosca" },
      { id: 12, name: "Tobias dei Salici" },
    ]);
    mocked(fetchZones).mockResolvedValue([
      { id: 1, title: "Aerivel" },
      { id: 2, title: "Marca di Brina" },
    ]);
    mocked(fetchZoneLandmarks).mockResolvedValue([]);
  },
} satisfies Meta<typeof AttachEntityButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const PickType: Story = {
  play: async () => {
    const dialog = await screen.findByRole("dialog");
    await expect(dialog).toHaveTextContent("Collega un personaggio esistente");
  },
};

export const PickEntity: Story = {
  play: async () => {
    await screen.findByRole("dialog");
    await userEvent.selectOptions(
      screen.getByRole("combobox", { name: "Tipo di personaggio" }),
      "npc"
    );

    const entity = await screen.findByRole("combobox", { name: "Personaggio" });
    await expect(fetchLinkableEntities).toHaveBeenCalledWith("npc");
    await waitFor(async () =>
      expect(
        await screen.findByRole("option", { name: "Mirelda Fosca" })
      ).toBeVisible()
    );
    await expect(entity).toBeEnabled();
  },
};

export const Cancel: Story = {
  play: async ({ args }) => {
    await screen.findByRole("dialog");
    await userEvent.click(screen.getByRole("button", { name: "Annulla" }));
    await expect(args.onClose).toHaveBeenCalledOnce();
  },
};

export const Closed: Story = { args: { isOpen: false } };

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, screen, waitFor } from "storybook/test";

import { landmarks, zones } from "@/.storybook/fixtures/zones";
import fetchZoneLandmarks from "@/app/lib/data/maps/fetchZoneLandmarks";
import fetchZones from "@/app/lib/data/maps/fetchZones";
import type MutationResult from "@/app/lib/definitions/types/MutationResult";
import AssignLocationModal from "./AssignLocationModal";

/**
 * The two-step location picker (SPEC-008 §5): a zone, then a landmark within
 * it. The caller supplies the mutation, so NPCs and deities share it.
 */
const meta = {
  component: AssignLocationModal,
  args: {
    isOpen: true,
    onClose: fn(),
    onAssigned: fn(),
    assignAction: fn((): Promise<MutationResult> =>
      Promise.resolve({ ok: true })
    ),
    entityId: 1,
    currentZoneId: 5,
    currentPoiId: 9,
    currentLocationLabel: "Taverna del Corvo",
  },
  beforeEach: () => {
    mocked(fetchZones).mockResolvedValue(zones);
    mocked(fetchZoneLandmarks).mockResolvedValue(landmarks);
  },
} satisfies Meta<typeof AssignLocationModal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Open: Story = {
  play: async ({ args, userEvent }) => {
    await screen.findByRole("dialog");
    await userEvent.click(screen.getByRole("button", { name: "Salva" }));
    await waitFor(() =>
      expect(args.assignAction).toHaveBeenCalledWith({
        id: 1,
        zoneId: 5,
        poiId: 9,
      })
    );
    await expect(args.onAssigned).toHaveBeenCalledOnce();
  },
};

export const Unplaced: Story = {
  args: {
    currentZoneId: null,
    currentPoiId: null,
    currentLocationLabel: "Sconosciuta",
  },
};

export const Refused: Story = {
  args: {
    assignAction: fn((): Promise<MutationResult> =>
      Promise.resolve({
        ok: false,
        errors: { zoneId: [{ key: "alreadyAtLocation" }] },
      })
    ),
  },
  play: async ({ args, userEvent }) => {
    await screen.findByRole("dialog");
    await userEvent.click(screen.getByRole("button", { name: "Salva" }));
    await waitFor(() => expect(args.assignAction).toHaveBeenCalled());
    await expect(args.onClose).not.toHaveBeenCalled();
  },
};

export const CreatingAPlace: Story = {
  play: async ({ userEvent }) => {
    await screen.findByRole("dialog");
    await userEvent.click(
      screen.getByRole("button", { name: /Crea un nuovo luogo/i })
    );
  },
};

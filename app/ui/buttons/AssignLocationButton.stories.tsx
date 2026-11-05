import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, screen } from "storybook/test";

import { landmarks, zones } from "@/.storybook/fixtures/zones";
import fetchZoneLandmarks from "@/app/lib/data/maps/fetchZoneLandmarks";
import fetchZones from "@/app/lib/data/maps/fetchZones";
import PageType from "@/app/lib/definitions/types/PageType";
import AssignLocationButton from "./AssignLocationButton";

/**
 * Opens the assignment modal: the admin list's row action, or — as
 * `variant="text"` — the location text on a card (SPEC-007 T3, SPEC-008 T5).
 * A player sees the label only (SPEC-022 T8b).
 */
const meta = {
  component: AssignLocationButton,
  args: {
    pageType: PageType.Npc,
    entityId: 1,
    currentZoneId: 5,
    currentPoiId: 9,
    currentLocationLabel: "Taverna del Corvo",
  },
  beforeEach: () => {
    mocked(fetchZones).mockResolvedValue(zones);
    mocked(fetchZoneLandmarks).mockResolvedValue(landmarks);
  },
} satisfies Meta<typeof AssignLocationButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const RowAction: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Posiziona" }));
    await expect(await screen.findByRole("dialog")).toBeVisible();
  },
};

export const CardText: Story = {
  args: { variant: "text" },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Taverna del Corvo" })
    );
    await expect(await screen.findByRole("dialog")).toBeVisible();
  },
};

export const PlayerSeesTheLabel: Story = {
  args: { variant: "text" },
  globals: { viewer: "player" },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("button")).toBeNull();
    await expect(canvas.getByText("Taverna del Corvo")).toBeVisible();
  },
};

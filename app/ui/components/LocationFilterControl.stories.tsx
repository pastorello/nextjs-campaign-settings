import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";

import { landmarks, zones } from "@/.storybook/fixtures/zones";
import fetchZoneLandmarks from "@/app/lib/data/maps/fetchZoneLandmarks";
import fetchZones from "@/app/lib/data/maps/fetchZones";
import { dashboardPath } from "@/i18n/dashboardPath";
import LocationFilterControl from "./LocationFilterControl";

/** The admin list's zone → landmark filter (SPEC-008 T6), read from `?zoneId=`. */
const meta = {
  component: LocationFilterControl,
  beforeEach: () => {
    mocked(fetchZones).mockResolvedValue(zones);
    mocked(fetchZoneLandmarks).mockResolvedValue(landmarks);
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: dashboardPath("dnd5e", "/npc"),
        segments: [["system", "dnd5e"]],
      },
    },
  },
} satisfies Meta<typeof LocationFilterControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const AllZones: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("combobox")).toBeVisible();
    await expect(canvas.getAllByRole("combobox")).toHaveLength(1);
  },
};

export const ZoneSelected: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: dashboardPath("dnd5e", "/npc"),
        segments: [["system", "dnd5e"]],
        query: { zoneId: "5" },
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByRole("option", { name: "Ponte Spezzato" })
    ).toBeInTheDocument();
    await expect(canvas.getAllByRole("combobox")).toHaveLength(2);
  },
};

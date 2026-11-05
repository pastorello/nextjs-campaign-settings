import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { linkOptions } from "@/.storybook/fixtures/calendar";
import WorldHistoryFilters from "./WorldHistoryFilters";

/** World history's filters by linked place, NPC, deity and faction. */
const meta = {
  component: WorldHistoryFilters,
  args: {
    linkOptions,
    query: { place: null, npc: null, deity: null, faction: null, page: 1 },
  },
} satisfies Meta<typeof WorldHistoryFilters>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unfiltered: Story = {
  play: async ({ canvas }) => {
    for (const name of ["Luogo", "PNG", "Divinità", "Fazione"]) {
      await expect(canvas.getByRole("button", { name })).toBeVisible();
    }
    await expect(
      canvas.queryByRole("button", { name: "Rimuovi filtri" })
    ).not.toBeInTheDocument();
  },
};

export const Filtered: Story = {
  args: {
    query: { place: 4, npc: null, deity: null, faction: 1, page: 1 },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Rimuovi filtri" })
    ).toBeVisible();
  },
};

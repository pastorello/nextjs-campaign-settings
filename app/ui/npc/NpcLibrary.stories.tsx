import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import {
  npcs,
  npcPlacements,
  factionOptions,
} from "@/.storybook/fixtures/npcs";
import NpcLibrary from "./NpcLibrary";

const meta = {
  component: NpcLibrary,
  args: {
    items: npcs,
    placements: npcPlacements,
    optionBundle: factionOptions,
  },
} satisfies Meta<typeof NpcLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Aldric Valmonte/)).toBeVisible();
  },
};

export const Empty: Story = {
  args: { items: [] },
  play: async ({ canvas }) => {
    await expect(canvas.queryByText(/Aldric Valmonte/)).not.toBeInTheDocument();
  },
};

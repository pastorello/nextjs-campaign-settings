import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import {
  aldric,
  mira,
  npcPlacements,
  factionOptions,
} from "@/.storybook/fixtures/npcs";
import NpcCard from "./NpcCard";

const meta = {
  component: NpcCard,
  args: {
    cardItem: aldric,
    placement: npcPlacements[1],
    optionBundle: factionOptions,
  },
} satisfies Meta<typeof NpcCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Collapsed: the header only, the details wait until the card is opened. */
export const Collapsed: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Aldric Valmonte/)).toBeVisible();
    await expect(
      canvas.queryByText(/Paziente, ironico/)
    ).not.toBeInTheDocument();
  },
};

/** Opened by its header button: the details appear. */
export const Expanded: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole("button")[0]!);
    await expect(await canvas.findByText(/Paziente, ironico/)).toBeVisible();
  },
};

/** A second record: no image, and where the model allows it, fewer fields. */
export const Plain: Story = {
  args: { cardItem: mira },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole("button")[0]!);
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
  },
};

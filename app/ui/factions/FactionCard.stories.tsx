import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import {
  mapmakers,
  lampLighters,
  mapmakersRoster,
} from "@/.storybook/fixtures/factions";
import FactionCard from "./FactionCard";

const meta = {
  component: FactionCard,
  args: {
    cardItem: mapmakers,
    roster: mapmakersRoster,
  },
} satisfies Meta<typeof FactionCard>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Collapsed: the header only, the details wait until the card is opened. */
export const Collapsed: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Gilda dei Cartografi/)).toBeVisible();
    await expect(canvas.queryByText(/disegnatori/)).not.toBeInTheDocument();
  },
};

/** Opened by its header button: the details appear. */
export const Expanded: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole("button")[0]!);
    await expect(await canvas.findByText(/disegnatori/)).toBeVisible();
  },
};

/** A second record: no image, and where the model allows it, fewer fields. */
export const Plain: Story = {
  args: { cardItem: lampLighters },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getAllByRole("button")[0]!);
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
  },
};

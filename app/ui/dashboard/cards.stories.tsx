import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";

import fetchCardData from "@/app/lib/data/fetchCardData";
import CardWrapper, { Card } from "./cards";

/**
 * The overview's count cards. `Card` is one tile; `CardWrapper` is the async
 * Server Component that reads the counts and keeps the cards the game system
 * has a list page for (ADR-0013).
 */
const meta = {
  component: CardWrapper,
  args: { system: "dnd5e" },
  beforeEach: () => {
    mocked(fetchCardData).mockResolvedValue({
      numberOfmagicItems: 14,
      numberOfNpc: 31,
      numberOfSpells: 361,
      numberOfDeities: 9,
      numberOfPlaces: 58,
      numberOfFactions: 6,
    });
  },
  decorators: [
    (Story) => (
      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof CardWrapper>;

export default meta;
type Story = StoryObj<typeof meta>;

export const DungeonsAndDragons: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("361")).toBeVisible();
    await expect(canvas.getAllByRole("link")).toHaveLength(6);
  },
};

/** The 5e catalogues have no list page under Daggerheart. */
export const Daggerheart: Story = {
  args: { system: "daggerheart" },
  play: async ({ canvas }) => {
    await canvas.findByText("58");
    await expect(canvas.queryByText("361")).toBeNull();
  },
};

export const SingleCard: Story = {
  render: () => <Card title="PNG" value={31} type="npc" system="dnd5e" />,
};

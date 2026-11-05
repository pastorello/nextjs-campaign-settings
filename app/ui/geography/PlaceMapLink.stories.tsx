import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import PlaceMapLink from "./PlaceMapLink";

/**
 * The map icon beside a character's location on its card (SPEC-026). The
 * link is pale blue because it only ever sits on the dark card.
 */
const meta = {
  component: PlaceMapLink,
  args: { zoneId: 2, placeLabel: "Marca di Brina" },
  decorators: [
    (Story) => (
      <div className="rounded-xl bg-slate-800 p-4 text-white">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof PlaceMapLink>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("link", { name: "Apri «Marca di Brina» sulla mappa" })
    ).toHaveAttribute("href", expect.stringContaining("/geography?place=2"));
  },
};

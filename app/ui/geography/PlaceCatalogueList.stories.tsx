import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { dhPage } from "@/.storybook/fixtures/daggerheart";
import PageType from "@/app/lib/definitions/types/PageType";
import PlaceCatalogueList from "./PlaceCatalogueList";

/**
 * The records of one Daggerheart catalogue linked to a place, in its popover
 * (SPEC-027 §5.6). The loader is a prop, so no Server Action is involved.
 */
const meta = {
  component: PlaceCatalogueList,
  args: {
    zoneId: 2,
    page: PageType.DhCommunity,
    titleKey: "dhCommunities.world.title",
    load: () =>
      Promise.resolve([
        { id: 1, name: "Gente del Faro" },
        { id: 2, name: "Pescatori di Brina" },
      ]),
  },
  parameters: { nextjs: dhPage("/geography") },
} satisfies Meta<typeof PlaceCatalogueList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Listed: Story = {
  play: async ({ canvas }) => {
    const section = await canvas.findByRole("region", { name: "Comunità" });
    await expect(section).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "Gente del Faro" })
    ).toHaveAttribute("href", expect.stringContaining("/daggerheart/"));
  },
};

/** A place with none renders nothing at all. */
export const Empty: Story = {
  args: { load: () => Promise.resolve([]) },
};

/** Under 5e the catalogue does not exist: the world is shared, this is not. */
export const OtherSystem: Story = {
  parameters: { nextjs: { navigation: { segments: [["system", "dnd5e"]] } } },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("region", { name: "Comunità" })).toBeNull();
  },
};

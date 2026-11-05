import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";

import { spells } from "@/.storybook/fixtures/spells";
import { dm } from "@/.storybook/fixtures/viewers";
import getViewer from "@/app/lib/auth/getViewer";
import fetchRecordLinkTargets from "@/app/lib/data/richText/fetchRecordLinkTargets";
import { fetchFilteredSpells } from "@/app/lib/data/spells/fetchFilteredSpells";
import PageType from "@/app/lib/definitions/types/PageType";
import EntityLibrary from "./EntityLibrary";

/**
 * The server half of a public list (TD-30): suspends on the domain's query,
 * resolves the record links of the rows shown, and hands the rows to the
 * domain's card library. An async Server Component.
 */
const meta = {
  component: EntityLibrary,
  args: { pageType: PageType.Spell, system: "dnd5e" },
  parameters: { layout: "fullscreen" },
  beforeEach: () => {
    mocked(getViewer).mockResolvedValue(dm);
    mocked(fetchRecordLinkTargets).mockResolvedValue({});
  },
} satisfies Meta<typeof EntityLibrary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Spells: Story = {
  beforeEach: () => {
    mocked(fetchFilteredSpells).mockResolvedValue(spells);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByText("Lama di brina")).toBeVisible();
  },
};

export const NoSpells: Story = {
  beforeEach: () => {
    mocked(fetchFilteredSpells).mockResolvedValue([]);
  },
};

/** A subclass is shown on its class's page: its list renders nothing. */
export const NoPublicList: Story = {
  args: { pageType: PageType.DhSubclass, system: "daggerheart" },
};

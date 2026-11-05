import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked } from "storybook/test";

import { aldric, factionOptions, mira } from "@/.storybook/fixtures/npcs";
import { spells } from "@/.storybook/fixtures/spells";
import { landmarks, zones } from "@/.storybook/fixtures/zones";
import { dm } from "@/.storybook/fixtures/viewers";
import getViewer from "@/app/lib/auth/getViewer";
import fetchDerivedAncestry from "@/app/lib/data/maps/fetchDerivedAncestry";
import fetchZoneLandmarks from "@/app/lib/data/maps/fetchZoneLandmarks";
import fetchZones from "@/app/lib/data/maps/fetchZones";
import fetchFieldOptions from "@/app/lib/data/options/fetchFieldOptions";
import fetchRecordLinkTargets from "@/app/lib/data/richText/fetchRecordLinkTargets";
import { fetchFilteredNpc } from "@/app/lib/data/npc/fetchFilteredNpc";
import { fetchFilteredSpells } from "@/app/lib/data/spells/fetchFilteredSpells";
import PageType from "@/app/lib/definitions/types/PageType";
import EntityList from "./EntityList";

/**
 * The admin list for any domain, driven by `listConfig` (TD-09): a table from
 * `md` up, a stacked list below. An async Server Component — every reader it
 * calls is a spy (ADR-0021).
 */
const meta = {
  component: EntityList,
  args: { pageType: PageType.Spell, system: "dnd5e" },
  parameters: { layout: "fullscreen" },
  beforeEach: () => {
    mocked(getViewer).mockResolvedValue(dm);
    mocked(fetchRecordLinkTargets).mockResolvedValue({});
    mocked(fetchZones).mockResolvedValue(zones);
    mocked(fetchZoneLandmarks).mockResolvedValue(landmarks);
  },
} satisfies Meta<typeof EntityList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Spells: Story = {
  beforeEach: () => {
    mocked(fetchFilteredSpells).mockResolvedValue(spells);
  },
  play: async ({ canvas }) => {
    await expect(await canvas.findByTestId("entity-list-table")).toBeVisible();
    await expect(
      canvas.getAllByRole("button", { name: /Lama di brina/ }).length
    ).toBeGreaterThan(0);
  },
};

export const Empty: Story = {
  beforeEach: () => {
    mocked(fetchFilteredSpells).mockResolvedValue([]);
  },
  play: async ({ canvas }) => {
    await expect(
      await canvas.findByTestId("entity-list-table")
    ).toBeInTheDocument();
    await expect(canvas.queryByRole("link", { name: /Esporta/ })).toBeNull();
  },
};

/** NPCs and deities carry a location: its filter and a "place" row action. */
export const NpcsWithLocation: Story = {
  args: { pageType: PageType.Npc },
  beforeEach: () => {
    mocked(fetchFilteredNpc).mockResolvedValue([aldric, mira]);
    mocked(fetchFieldOptions).mockResolvedValue(factionOptions.faction ?? []);
    mocked(fetchDerivedAncestry).mockResolvedValue(
      new Map([
        [
          aldric.id,
          [
            { id: 9, title: "Taverna del Corvo", kind: "poi" },
            { id: 5, title: "Valle dei Corvi", kind: "region" },
          ],
        ],
      ])
    );
  },
  play: async ({ canvas }) => {
    await expect(
      (await canvas.findAllByRole("button", { name: "Posiziona" })).length
    ).toBeGreaterThan(0);
  },
};

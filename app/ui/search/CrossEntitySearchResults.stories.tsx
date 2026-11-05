import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { searchResult } from "@/.storybook/fixtures/search";
import CrossEntitySearchResults from "./CrossEntitySearchResults";

/** The search page's results, grouped by domain in the spec's fixed order. */
const meta = {
  component: CrossEntitySearchResults,
  args: { term: "corvo", results: searchResult() },
} satisfies Meta<typeof CrossEntitySearchResults>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Grouped: Story = {
  args: {
    results: searchResult({
      spells: [{ id: 3, name: "Richiamo del corvo" }],
      npc: [
        { id: 4, name: "Mirela la Cartografa" },
        { id: 5, name: "Aldric Valmonte" },
      ],
      places: [{ id: 9, name: "Taverna del Corvo" }],
    }),
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("link", { name: "Taverna del Corvo" })
    ).toBeVisible();
    await expect(canvas.getAllByRole("heading", { level: 2 })).toHaveLength(3);
  },
};

/** More matches than the cap shows: the group links to the full list. */
export const CappedGroup: Story = {
  args: {
    results: (() => {
      const result = searchResult({
        spells: [
          { id: 1, name: "Richiamo del corvo" },
          { id: 2, name: "Ala di corvo" },
        ],
      });
      return { ...result, spells: { ...result.spells, total: 14 } };
    })(),
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: /14/ })).toBeVisible();
  },
};

export const NoMatches: Story = {};

export const NoTerm: Story = { args: { term: "" } };

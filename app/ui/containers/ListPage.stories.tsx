import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { ListPage } from "./ListPage";

/** The shell of a public list page: title, search, count, reset, pagination. */
const meta = {
  component: ListPage,
  args: {
    title: "Incantesimi",
    searchPlaceholder: "Cerca un incantesimo",
    itemCount: { total: 24, filtered: 12, totalPages: 3, filteredPages: 2 },
    itemNamePlural: "incantesimi",
    itemNameSingular: "incantesimo",
    children: <p className="mt-4">Le schede dei risultati.</p>,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof ListPage>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(await canvas.findByRole("status")).toHaveTextContent("12");
  },
};

export const WithNewItem: Story = { args: { newItemRoute: "/spells" } };

export const SingleResult: Story = {
  args: {
    itemCount: { total: 24, filtered: 1, totalPages: 3, filteredPages: 1 },
  },
};

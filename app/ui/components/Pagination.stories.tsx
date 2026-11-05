import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import Pagination from "./pagination";
import { dashboardPath } from "@/i18n/dashboardPath";

/** A list page's pager; the current page comes from the `page` query param. */
const meta = {
  component: Pagination,
  args: { totalPages: 12 },
  parameters: {
    nextjs: {
      navigation: {
        pathname: dashboardPath("dnd5e", "/spells"),
        query: { page: "5" },
      },
    },
  },
} satisfies Meta<typeof Pagination>;

export default meta;
type Story = StoryObj<typeof meta>;

export const MiddlePage: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("5")).toHaveAttribute("aria-current", "page");
    await expect(
      canvas.getByRole("link", { name: /pagina 6/i })
    ).toHaveAttribute("href", `${dashboardPath("dnd5e", "/spells")}?page=6`);
  },
};

export const FirstPage: Story = {
  parameters: {
    nextjs: {
      navigation: { pathname: dashboardPath("dnd5e", "/spells"), query: {} },
    },
  },
};

export const LastPage: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: dashboardPath("dnd5e", "/spells"),
        query: { page: "12" },
      },
    },
  },
};

/** The other query params survive a page change. */
export const KeepsFilters: Story = {
  args: { totalPages: 3 },
  parameters: {
    nextjs: {
      navigation: {
        pathname: dashboardPath("dnd5e", "/spells"),
        query: { page: "1", query: "brina", level: "2" },
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("link", { name: /pagina 2/i })
    ).toHaveAttribute(
      "href",
      `${dashboardPath("dnd5e", "/spells")}?page=2&query=brina&level=2`
    );
  },
};

export const SinglePage: Story = { args: { totalPages: 1 } };

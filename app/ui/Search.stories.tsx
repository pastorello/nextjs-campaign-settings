import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect, waitFor } from "storybook/test";

import Search from "./search";
import { dashboardPath } from "@/i18n/dashboardPath";

/** A list's free-text search: debounced, written to the `query` param. */
const meta = {
  component: Search,
  args: { placeholder: "Cerca incantesimi..." },
  parameters: {
    nextjs: {
      navigation: {
        pathname: dashboardPath("dnd5e", "/spells"),
        query: { page: "3" },
      },
    },
  },
} satisfies Meta<typeof Search>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByRole("textbox"), "brina");
    // A new term goes back to the first page.
    await waitFor(() =>
      expect(getRouter().replace).toHaveBeenLastCalledWith(
        `${dashboardPath("dnd5e", "/spells")}?page=1&query=brina`
      )
    );
  },
};

export const WithQuery: Story = {
  parameters: {
    nextjs: {
      navigation: {
        pathname: dashboardPath("dnd5e", "/spells"),
        query: { query: "lama" },
      },
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("textbox")).toHaveValue("lama");
  },
};

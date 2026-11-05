import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { getRouter } from "@storybook/nextjs-vite/navigation.mock";
import { expect } from "storybook/test";

import AdminListHeader from "./AdminListHeader";
import { dashboardPath } from "@/i18n/dashboardPath";

/** An admin list's toolbar: search, the count, "new" and the filter reset. */
const meta = {
  component: AdminListHeader,
  args: {
    searchPlaceholder: "Cerca incantesimi...",
    countText: "2 incantesimi",
    newItemHref: dashboardPath("dnd5e", "/spells/create"),
    newItemLabel: "Nuovo incantesimo",
  },
  parameters: {
    nextjs: {
      navigation: {
        pathname: dashboardPath("dnd5e", "/spells"),
        query: { level: "2" },
      },
    },
  },
} satisfies Meta<typeof AdminListHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("status")).toHaveTextContent("2 incantesimi");
    await expect(
      canvas.getByRole("link", { name: "Nuovo incantesimo" })
    ).toHaveAttribute("href", dashboardPath("dnd5e", "/spells/create"));

    // Reset drops every filter, keeping the path.
    await userEvent.click(
      canvas.getByRole("button", { name: "Azzera filtri" })
    );
    await expect(getRouter().replace).toHaveBeenCalledWith(
      dashboardPath("dnd5e", "/spells")
    );
  },
};

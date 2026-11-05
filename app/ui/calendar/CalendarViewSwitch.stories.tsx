import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import CalendarViewSwitch from "./CalendarViewSwitch";

/** List or month grid, kept in the `?view=` URL parameter (SPEC-014 §5.6). */
const meta = {
  component: CalendarViewSwitch,
} satisfies Meta<typeof CalendarViewSwitch>;

export default meta;
type Story = StoryObj<typeof meta>;

export const List: Story = {
  args: { view: "list" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Elenco" })).toHaveAttribute(
      "aria-current",
      "page"
    );
    await expect(
      canvas.getByRole("link", { name: "Mese" })
    ).not.toHaveAttribute("aria-current");
  },
};

export const Grid: Story = {
  args: { view: "grid" },
  play: async ({ canvas }) => {
    await expect(canvas.getByRole("link", { name: "Mese" })).toHaveAttribute(
      "aria-current",
      "page"
    );
  },
};

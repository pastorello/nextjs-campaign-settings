import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { human, systems, universal } from "@/.storybook/fixtures/calendar";
import DateSystemToggle from "./DateSystemToggle";

/** The viewer's choice of date system, kept in a cookie (SPEC-014 §5.2). */
const meta = {
  component: DateSystemToggle,
  args: { systems, selectedId: universal.id },
} satisfies Meta<typeof DateSystemToggle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("combobox", { name: "Mostra le date in" })
    ).toHaveValue(String(universal.id));
  },
};

export const Switch: Story = {
  play: async ({ canvas, userEvent }) => {
    const select = canvas.getByRole("combobox", { name: "Mostra le date in" });
    await userEvent.selectOptions(select, String(human.id));
    await expect(select).toHaveValue(String(human.id));
  },
};

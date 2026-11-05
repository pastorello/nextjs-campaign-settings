import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { day, human, universal } from "@/.storybook/fixtures/calendar";
import WorldDate from "./WorldDate";

/** A date read in one date system (SPEC-014 §5.1–5.2). */
const meta = {
  component: WorldDate,
  args: { universalDay: day(3), system: human },
} satisfies Meta<typeof WorldDate>;

export default meta;
type Story = StoryObj<typeof meta>;

export const HumanCount: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Brumaio/)).toBeVisible();
    await expect(canvas.getByText(/d\.C\.|Dopo Cataclisma/)).toBeVisible();
  },
};

export const WithHour: Story = {
  args: { hour: 14 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/14/)).toBeVisible();
  },
};

export const UniversalCount: Story = {
  args: { system: universal },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Gennaio/)).toBeVisible();
  },
};

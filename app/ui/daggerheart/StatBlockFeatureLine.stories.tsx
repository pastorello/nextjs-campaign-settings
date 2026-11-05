import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import StatBlockFeatureLine from "./StatBlockFeatureLine";

const meta = {
  component: StatBlockFeatureLine,
  args: {
    feature: {
      name: "Campana Lontana",
      kind: "action",
      text: "<p>Un rintocco attira i curiosi.</p>",
    },
  },
} satisfies Meta<typeof StatBlockFeatureLine>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Campana Lontana")).toBeVisible();
    await expect(canvas.getByText("Azione")).toBeVisible();
  },
};

/** An adversary's Fear feature carries a marker. */
export const Fear: Story = {
  args: {
    feature: {
      name: "Fiamma Spenta",
      kind: "reaction",
      fear: true,
      text: "<p>Si riaccende quando viene colpito.</p>",
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Paura")).toBeVisible();
  },
};

/** An environment's feature can end in a prompt question. */
export const WithQuestions: Story = {
  args: {
    feature: {
      name: "Nebbia Fitta",
      kind: "passive",
      text: "<p>Nessuno vede oltre un braccio.</p>",
      questions: "<p>Chi ha già smarrito qualcuno qui?</p>",
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/smarrito qualcuno/)).toBeVisible();
  },
};

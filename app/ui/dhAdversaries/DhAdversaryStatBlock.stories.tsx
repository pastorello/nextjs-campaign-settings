import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import {
  dhPage,
  lanternWraith,
  reefCrab,
} from "@/.storybook/fixtures/daggerheart";
import DhAdversaryStatBlock from "./DhAdversaryStatBlock";

const meta = {
  component: DhAdversaryStatBlock,
  args: { adversary: lanternWraith },
  parameters: { nextjs: dhPage("/adversaries") },
} satisfies Meta<typeof DhAdversaryStatBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Every field laid out as a table reads it. */
export const Full: Story = {
  play: async ({ canvas }) => {
    const block = canvas.getByRole("article", {
      name: "Spettro della Lanterna",
    });
    await expect(block).toBeVisible();
    await expect(canvas.getByText("8/15")).toBeVisible();
    await expect(canvas.getByText("Fiamma Spenta")).toBeVisible();
    await expect(canvas.getByText("Paura")).toBeVisible();
  },
};

/** No description, thresholds, experiences or features, and a horde density. */
export const Minimal: Story = {
  args: { adversary: reefCrab },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("article", { name: "Granchio della Scogliera" })
    ).toBeVisible();
    await expect(canvas.getByText("Nessuna")).toBeVisible();
  },
};

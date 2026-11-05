import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import {
  bareEnvironment,
  dhPage,
  fogHarbour,
} from "@/.storybook/fixtures/daggerheart";
import DhEnvironmentStatBlock from "./DhEnvironmentStatBlock";

const meta = {
  component: DhEnvironmentStatBlock,
  args: { environment: fogHarbour },
  parameters: { nextjs: dhPage("/environments") },
} satisfies Meta<typeof DhEnvironmentStatBlock>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Adversaries and places link out; features come with their questions. */
export const Full: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("article", { name: "Porto nella Nebbia" })
    ).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "Spettro della Lanterna" })
    ).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "Molo dei Sospiri" })
    ).toBeVisible();
    await expect(canvas.getByText(/smarrito qualcuno/)).toBeVisible();
  },
};

export const Minimal: Story = {
  args: { environment: bareEnvironment },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("link")).not.toBeInTheDocument();
    await expect(canvas.queryByText("Privilegi")).not.toBeInTheDocument();
  },
};

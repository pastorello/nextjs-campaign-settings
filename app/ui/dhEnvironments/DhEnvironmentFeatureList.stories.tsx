import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";

import { fogFeatures } from "@/.storybook/fixtures/daggerheart";
import reorderDhEnvironmentFeatures from "@/app/lib/data/dhEnvironments/reorderDhEnvironmentFeatures";
import DhEnvironmentFeatureList from "./DhEnvironmentFeatureList";

/** The row actions are Server Actions, so spies here (ADR-0021). */
const meta = {
  component: DhEnvironmentFeatureList,
  args: { environmentId: 1, features: fogFeatures },
} satisfies Meta<typeof DhEnvironmentFeatureList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Nebbia Fitta")).toBeVisible();
    await expect(canvas.getByText(/smarrito qualcuno/)).toBeVisible();
  },
};

export const Empty: Story = {
  args: { features: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Aggiungi privilegio" })
    ).toBeVisible();
  },
};

export const Reorder: Story = {
  beforeEach: () => {
    mocked(reorderDhEnvironmentFeatures).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Sposta giù Nebbia Fitta" })
    );
    await waitFor(() =>
      expect(reorderDhEnvironmentFeatures).toHaveBeenCalledWith(1, [2, 1])
    );
  },
};

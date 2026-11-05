import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";

import { wraithFeatures } from "@/.storybook/fixtures/daggerheart";
import reorderDhAdversaryFeatures from "@/app/lib/data/dhAdversaries/reorderDhAdversaryFeatures";
import DhAdversaryFeatureList from "./DhAdversaryFeatureList";

/** The row actions are Server Actions, so spies here (ADR-0021). */
const meta = {
  component: DhAdversaryFeatureList,
  args: { adversaryId: 1, features: wraithFeatures },
} satisfies Meta<typeof DhAdversaryFeatureList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Fiamma Spenta")).toBeVisible();
    await expect(canvas.getByText("Paura")).toBeVisible();
    await expect(canvas.getByText("Senza Peso")).toBeVisible();
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
    mocked(reorderDhAdversaryFeatures).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Sposta giù Fiamma Spenta" })
    );
    await waitFor(() =>
      expect(reorderDhAdversaryFeatures).toHaveBeenCalledWith(1, [2, 1])
    );
  },
};

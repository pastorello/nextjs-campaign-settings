import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";

import { vigilFeatures } from "@/.storybook/fixtures/daggerheart";
import reorderDhSubclassFeatures from "@/app/lib/data/dhSubclasses/reorderDhSubclassFeatures";
import DhSubclassFeatureList from "./DhSubclassFeatureList";

/** The row actions are Server Actions, so spies here (ADR-0021). */
const meta = {
  component: DhSubclassFeatureList,
  args: { subclassId: 1, features: vigilFeatures },
} satisfies Meta<typeof DhSubclassFeatureList>;

export default meta;
type Story = StoryObj<typeof meta>;

/** Three tiers, each its own group, even the one with no feature. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByTestId("tier-foundation")).toBeVisible();
    await expect(canvas.getByTestId("tier-specialization")).toBeVisible();
    await expect(canvas.getByText("Faro Vivente")).toBeVisible();
    await expect(
      canvas.getByText("Ancora nessun privilegio in questo grado.")
    ).toBeVisible();
  },
};

/** Moving a feature stays within its tier. */
export const Reorder: Story = {
  beforeEach: () => {
    mocked(reorderDhSubclassFeatures).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    const [moveDown] = canvas.getAllByRole("button", { name: /giù/i });
    await userEvent.click(moveDown!);
    await waitFor(() => expect(reorderDhSubclassFeatures).toHaveBeenCalled());
  },
};

export const Empty: Story = {
  args: { features: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getAllByText(/Ancora nessun privilegio/)).toHaveLength(
      3
    );
  },
};

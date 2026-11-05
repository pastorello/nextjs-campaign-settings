import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";

import { wraithExperiences } from "@/.storybook/fixtures/daggerheart";
import reorderDhAdversaryExperiences from "@/app/lib/data/dhAdversaries/reorderDhAdversaryExperiences";
import DhAdversaryExperienceList from "./DhAdversaryExperienceList";

/** The row actions are Server Actions, so spies here (ADR-0021). */
const meta = {
  component: DhAdversaryExperienceList,
  args: { adversaryId: 1, experiences: wraithExperiences },
} satisfies Meta<typeof DhAdversaryExperienceList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Vecchie dimore")).toBeVisible();
    // The bonus is signed.
    await expect(canvas.getByText("+2")).toBeVisible();
    await expect(canvas.getByText("-1")).toBeVisible();
  },
};

export const Empty: Story = {
  args: { experiences: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Aggiungi esperienza" })
    ).toBeVisible();
  },
};

export const Reorder: Story = {
  beforeEach: () => {
    mocked(reorderDhAdversaryExperiences).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Sposta giù Vecchie dimore" })
    );
    await waitFor(() =>
      expect(reorderDhAdversaryExperiences).toHaveBeenCalledWith(1, [2, 1])
    );
  },
};

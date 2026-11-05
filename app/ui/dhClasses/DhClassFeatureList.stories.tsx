import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, screen, waitFor, within } from "storybook/test";

import { wardenFeatures } from "@/.storybook/fixtures/daggerheart";
import deleteDhClassFeatureById from "@/app/lib/data/dhClasses/deleteDhClassFeatureById";
import reorderDhClassFeatures from "@/app/lib/data/dhClasses/reorderDhClassFeatures";
import DhClassFeatureList from "./DhClassFeatureList";

/** The row actions are Server Actions, so spies here (ADR-0021). */
const meta = {
  component: DhClassFeatureList,
  args: { classId: 1, features: wardenFeatures },
} satisfies Meta<typeof DhClassFeatureList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Veglia Lunga")).toBeVisible();
    await expect(canvas.getByText("Ultima Luce")).toBeVisible();
  },
};

export const Reorder: Story = {
  beforeEach: () => {
    mocked(reorderDhClassFeatures).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: 'Sposta "Veglia Lunga" in giù' })
    );
    await waitFor(() =>
      expect(reorderDhClassFeatures).toHaveBeenCalledWith(1, [12, 11])
    );
  },
};

export const AddOpensForm: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Aggiungi privilegio" })
    );
    await expect(
      await canvas.findByRole("button", { name: "Salva privilegio" })
    ).toBeVisible();
  },
};

/** A class keeps at least one feature: the server refuses the last delete. */
export const DeleteRefused: Story = {
  beforeEach: () => {
    mocked(deleteDhClassFeatureById).mockResolvedValue({
      ok: false,
      errors: {},
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Elimina Veglia Lunga" })
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /elimina/i })
    );
    await waitFor(() =>
      expect(deleteDhClassFeatureById).toHaveBeenCalledWith(11)
    );
  },
};

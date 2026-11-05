import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { useState } from "react";
import { expect, fn } from "storybook/test";

import RemovalOutcome from "@/app/lib/definitions/types/RemovalOutcome";
import RemovalOutcomeChoices from "./RemovalOutcomeChoices";

/**
 * The two outcomes of "Rimuovi" — take a place off the map, or delete it —
 * that both removal dialogs offer (SPEC-023).
 */
const meta = {
  component: RemovalOutcomeChoices,
  args: {
    name: "story-outcome",
    legend: "Cosa vuoi fare?",
    value: null,
    onChange: fn(),
    options: [
      {
        outcome: RemovalOutcome.unplace,
        label: "Rimuovi dalla mappa",
        detail: <p>«Torre Spezzata» torna tra i luoghi non posizionati.</p>,
      },
      {
        outcome: RemovalOutcome.delete,
        label: "Elimina definitivamente",
        isDestructive: true,
        detail: <p>«Torre Spezzata» viene eliminata.</p>,
      },
    ],
  },
} satisfies Meta<typeof RemovalOutcomeChoices>;

export default meta;
type Story = StoryObj<typeof meta>;

export const NothingChosen: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("group", { name: "Cosa vuoi fare?" })
    ).toBeVisible();
    await expect(
      canvas.getByRole("radio", { name: "Rimuovi dalla mappa" })
    ).not.toBeChecked();
  },
};

export const Chosen: Story = {
  args: { value: RemovalOutcome.unplace },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("radio", { name: "Rimuovi dalla mappa" })
    ).toBeChecked();
  },
};

/**
 * TD-163: the red label on the selected row's indigo background is under
 * 4.5:1, which axe flags (`color-contrast`).
 */
export const DestructiveChosen: Story = {
  args: { value: RemovalOutcome.delete },
  parameters: { a11y: { test: "todo" } },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("radio", { name: "Elimina definitivamente" })
    ).toBeChecked();
  },
};

export const Choose: Story = {
  render: function Render(args) {
    const [value, setValue] = useState<RemovalOutcome | null>(null);
    return (
      <RemovalOutcomeChoices {...args} value={value} onChange={setValue} />
    );
  },
  play: async ({ canvas, userEvent }) => {
    const unplace = canvas.getByRole("radio", { name: "Rimuovi dalla mappa" });
    await userEvent.click(unplace);
    await expect(unplace).toBeChecked();
  },
};

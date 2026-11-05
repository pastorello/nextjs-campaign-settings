import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { adventure } from "@/.storybook/fixtures/campaigns";
import { dashboardPath } from "@/i18n/dashboardPath";
import AdventureHeader from "./AdventureHeader";

/** An adventure page's title, target level and currency, with an inline edit. */
const meta = {
  component: AdventureHeader,
  args: { adventure },
} satisfies Meta<typeof AdventureHeader>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { name: adventure.title })
    ).toBeVisible();
    await expect(
      canvas.getByRole("link", { name: "Torna alla campagna" })
    ).toHaveAttribute("href", dashboardPath("dnd5e", "/campaign/1"));
    await expect(canvas.getByText(/Argento/)).toBeVisible();
  },
};

export const Standalone: Story = {
  args: { adventure: { ...adventure, campaignId: null } },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("link", { name: "Torna alla campagna" })
    ).toHaveAttribute("href", dashboardPath("dnd5e", "/campaign"));
  },
};

export const Daggerheart: Story = {
  args: { rulesSystem: "daggerheart" },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Grado/)).toBeVisible();
    // A Daggerheart adventure counts in handfuls: no currency unit.
    await expect(canvas.queryByText(/Argento/)).not.toBeInTheDocument();
  },
};

export const Editing: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Modifica" }));
    await expect(
      canvas.getByRole("button", { name: "Salva modifiche" })
    ).toBeVisible();
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { domainCards } from "@/.storybook/fixtures/daggerheart";
import DhDomainCardsByLevel from "./DhDomainCardsByLevel";

const meta = {
  component: DhDomainCardsByLevel,
  args: { cards: domainCards },
} satisfies Meta<typeof DhDomainCardsByLevel>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { level: 2, name: "Livello 1" })
    ).toBeVisible();
    await expect(
      canvas.getByRole("heading", { level: 2, name: "Livello 3" })
    ).toBeVisible();
    await expect(canvas.getAllByRole("article")).toHaveLength(3);
  },
};

/** On a class page the groups sit one heading level lower. */
export const UnderClassPage: Story = {
  args: { levelHeading: "h3" },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { level: 3, name: "Livello 1" })
    ).toBeVisible();
  },
};

export const Empty: Story = {
  args: { cards: [] },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByText("Nessuna carta dominio trovata")
    ).toBeVisible();
  },
};

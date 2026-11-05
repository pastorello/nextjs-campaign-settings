import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import {
  lanternCard,
  tideCard,
  tideCardDomain,
} from "@/.storybook/fixtures/daggerheart";
import DhDomainCardView from "./DhDomainCardView";

const meta = {
  component: DhDomainCardView,
  args: { card: lanternCard, domain: lanternCard.domain },
} satisfies Meta<typeof DhDomainCardView>;

export default meta;
type Story = StoryObj<typeof meta>;

/** The band carries the domain's colour and spells its name out. */
export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("article", { name: "Lanterna del Guardiano" })
    ).toBeVisible();
    await expect(canvas.getByText("Livello 1")).toBeVisible();
    await expect(canvas.getByText("Brace")).toBeVisible();
  },
};

export const OtherDomain: Story = {
  args: { card: tideCard, domain: tideCardDomain },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Marea")).toBeVisible();
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
  },
};

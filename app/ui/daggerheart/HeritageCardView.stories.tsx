import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { portrait } from "@/.storybook/fixtures/images";
import HeritageCardView from "./HeritageCardView";

const meta = {
  component: HeritageCardView,
  args: {
    name: "Nati dal Sale",
    image: portrait,
    imageAlt: "Immagine di Nati dal Sale",
    testId: "heritage-card",
    features: [
      { name: "Orecchio di Conchiglia", text: <p>Senti il mare sempre.</p> },
      { name: "Passo Sicuro", text: <p>Il ponte che oscilla non ti turba.</p> },
    ],
  },
} satisfies Meta<typeof HeritageCardView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("article", { name: "Nati dal Sale" })
    ).toBeVisible();
    await expect(canvas.getByText("Passo Sicuro")).toBeVisible();
  },
};

/** `children` sit between the name and the features. */
export const WithChildren: Story = {
  args: { image: null, children: <p>Rumorosa, solidale, diffidente</p> },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/solidale/)).toBeVisible();
  },
};

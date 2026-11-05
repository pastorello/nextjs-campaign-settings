import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect } from "storybook/test";

import { portrait } from "@/.storybook/fixtures/images";
import StatBlockView, { StatBlockNumber } from "./StatBlockView";

const meta = {
  component: StatBlockView,
  args: {
    name: "Giaco del Custode",
    headerLine: "Grado 2",
    image: portrait,
    imageAlt: "Immagine di Giaco del Custode",
    testId: "stat-block",
    children: (
      <dl className="flex gap-6">
        <StatBlockNumber label="Soglie" value="7/14" />
        <StatBlockNumber label="Punteggio" value={4} />
      </dl>
    ),
  },
} satisfies Meta<typeof StatBlockView>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("article", { name: "Giaco del Custode" })
    ).toBeVisible();
    await expect(canvas.getByText("7/14")).toBeVisible();
  },
};

export const WithoutImage: Story = {
  args: { image: null },
  play: async ({ canvas }) => {
    await expect(canvas.queryByRole("img")).not.toBeInTheDocument();
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, spyOn } from "storybook/test";

import { MapErrorBoundary } from "./MapErrorBoundary";

function Broken(): never {
  throw new Error("La mappa non è riuscita ad avviarsi.");
}

/** What the geography page shows when its map throws. */
const meta = {
  component: MapErrorBoundary,
  // React logs every error it catches; the story throws on purpose.
  beforeEach: () => {
    spyOn(console, "error").mockImplementation(() => undefined);
  },
} satisfies Meta<typeof MapErrorBoundary>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Fine: Story = {
  args: { children: <p>La mappa.</p> },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("La mappa.")).toBeVisible();
  },
};

/**
 * TD-164: "Riprova" is white on `blue-500`, 3.76:1 against the 4.5:1 floor
 * (`color-contrast`).
 */
export const Failed: Story = {
  parameters: { a11y: { test: "todo" } },
  args: { children: <Broken /> },
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("heading", { name: "Errore della mappa" })
    ).toBeVisible();
    await expect(
      canvas.getByText("La mappa non è riuscita ad avviarsi.")
    ).toBeVisible();
    await expect(canvas.getByRole("button", { name: "Riprova" })).toBeVisible();
  },
};

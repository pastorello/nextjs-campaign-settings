import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn } from "storybook/test";

import MapOptionsButton from "./MapOptionsButton";

/**
 * The pencil in the map's control stack: one menu for what administers the
 * map itself, not what is drawn on it.
 */
const meta = {
  component: MapOptionsButton,
  args: {
    hasMap: true,
    isRoot: false,
    onReplaceMap: fn(),
    onDeleteMap: fn(),
    onConfigureGrid: fn(),
    onReveal: fn(),
  },
  // The menu opens to the left of the button, as it does at the map's edge.
  decorators: [
    (Story) => (
      <div className="flex justify-end p-4 pl-64">
        <Story />
      </div>
    ),
  ],
} satisfies Meta<typeof MapOptionsButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Closed: Story = {
  play: async ({ canvas }) => {
    await expect(
      canvas.getByRole("button", { name: "Opzioni mappa" })
    ).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Sostituisci la mappa" })
    ).toBeNull();
  },
};

export const Open: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Opzioni mappa" })
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Configura la griglia" })
    );
    await expect(args.onConfigureGrid).toHaveBeenCalledOnce();
  },
};

export const Delete: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Opzioni mappa" })
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Elimina questa mappa" })
    );
    await expect(args.onDeleteMap).toHaveBeenCalledOnce();
  },
};

/** No map yet: upload instead of replace, and nothing to put a grid on. */
export const NoMap: Story = {
  args: { hasMap: false },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Opzioni mappa" })
    );
    await expect(
      canvas.getByRole("button", { name: "Carica la mappa" })
    ).toBeVisible();
    await expect(
      canvas.queryByRole("button", { name: "Configura la griglia" })
    ).toBeNull();
  },
};

/** The root cannot be deleted (SPEC-010, rule 1). */
export const Root: Story = {
  args: { isRoot: true },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Opzioni mappa" })
    );
    await expect(
      canvas.queryByRole("button", { name: "Elimina questa mappa" })
    ).toBeNull();
  },
};

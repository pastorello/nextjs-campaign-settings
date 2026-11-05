import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, screen, waitFor, within } from "storybook/test";

import { fightScene, npcOptions } from "@/.storybook/fixtures/campaigns";
import deleteSceneCreatureById from "@/app/lib/data/campaigns/deleteSceneCreatureById";
import reorderSceneCreatures from "@/app/lib/data/campaigns/reorderSceneCreatures";
import SceneCreatureList from "./SceneCreatureList";

/** A scene's creatures, with XP totals and links to their statistics. */
const meta = {
  component: SceneCreatureList,
  args: {
    sceneId: 20,
    creatures: fightScene.creatures,
    npcOptions,
    partySize: 4,
  },
} satisfies Meta<typeof SceneCreatureList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  // TD-159: the NPC link's aria-label omits its visible text
  // (label-content-name-mismatch).
  parameters: { a11y: { test: "todo" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Predone del passo/)).toBeVisible();
    await expect(
      canvas.getByRole("link", {
        name: "Statistiche di Predone del passo (si apre in una nuova scheda)",
      })
    ).toHaveAttribute("href", "https://example.test/predone");
  },
};

export const Empty: Story = {
  args: { creatures: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Nessuna creatura ancora.")).toBeVisible();
  },
};

export const Reorder: Story = {
  // TD-159: the NPC link's aria-label omits its visible text
  // (label-content-name-mismatch).
  parameters: { a11y: { test: "todo" } },
  beforeEach: () => {
    mocked(reorderSceneCreatures).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", {
        name: 'Sposta "Predone del passo" in basso',
      })
    );
    await waitFor(() =>
      expect(reorderSceneCreatures).toHaveBeenCalledWith(20, [31, 30])
    );
  },
};

export const Delete: Story = {
  // TD-159: the NPC link's aria-label omits its visible text
  // (label-content-name-mismatch).
  parameters: { a11y: { test: "todo" } },
  beforeEach: () => {
    mocked(deleteSceneCreatureById).mockResolvedValue(undefined);
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getAllByRole("button", { name: /Elimina/ })[0]!
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /elimina/i })
    );
    await waitFor(() =>
      expect(deleteSceneCreatureById).toHaveBeenCalledWith(30)
    );
  },
};

import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, screen, waitFor, within } from "storybook/test";

import {
  magicItemOptions,
  npcOptions,
  scenes,
  treasureOptions,
  zoneOptions,
} from "@/.storybook/fixtures/campaigns";
import deleteSceneById from "@/app/lib/data/campaigns/deleteSceneById";
import reorderScenes from "@/app/lib/data/campaigns/reorderScenes";
import setSceneAwarded from "@/app/lib/data/campaigns/setSceneAwarded";
import { encounterAdjustmentsKey } from "@/app/lib/hooks/useEncounterAdjustments";
import { dashboardPath } from "@/i18n/dashboardPath";
import EncounterAdjustmentsProvider from "./EncounterAdjustmentsProvider";
import SceneList from "./SceneList";

/**
 * An adventure's scenes with their creatures and loot (SPEC-013 §5.2): a
 * fight scene shows its difficulty, a scene is checked off when awarded.
 */
const meta = {
  component: SceneList,
  args: {
    adventureId: 5,
    scenes,
    currencyUnit: "silver",
    zoneOptions,
    npcOptions,
    magicItemOptions,
    treasureOptions,
    partySize: 4,
    targetLevel: 4,
  },
  decorators: [
    (Story) => (
      <EncounterAdjustmentsProvider
        adventureId={5}
        defaultPartySize={4}
        creatureIds={[30, 31]}
      >
        <Story />
      </EncounterAdjustmentsProvider>
    ),
  ],
  beforeEach: () => {
    window.localStorage.removeItem(encounterAdjustmentsKey(5));
  },
} satisfies Meta<typeof SceneList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText("L'imboscata al ponte")).toBeVisible();
    await expect(canvas.getByText("La galleria dei venti")).toBeVisible();
    // A fight shows its difficulty.
    await expect(canvas.getByText(/Difficoltà:/)).toBeVisible();
    // The scene's place links to the map.
    await expect(
      canvas.getByRole("link", { name: "Skreebar" })
    ).toHaveAttribute("href", dashboardPath("dnd5e", "/geography?place=4"));
    await expect(canvas.getByText("Luogo non assegnato")).toBeVisible();
  },
};

export const Empty: Story = {
  args: { scenes: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/Nessuna scena ancora/)).toBeVisible();
  },
};

export const Daggerheart: Story = {
  args: { rulesSystem: "daggerheart", adventureTier: 2 },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("L'imboscata al ponte")).toBeVisible();
  },
};

export const AwardScene: Story = {
  beforeEach: () => {
    mocked(setSceneAwarded).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    const [first] = canvas.getAllByRole("checkbox", { name: "Assegnato" });
    await userEvent.click(first!);
    await waitFor(() => expect(setSceneAwarded).toHaveBeenCalledWith(20, true));
  },
};

export const Reorder: Story = {
  beforeEach: () => {
    mocked(reorderScenes).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", {
        name: 'Sposta "L\'imboscata al ponte" in basso',
      })
    );
    await waitFor(() =>
      expect(reorderScenes).toHaveBeenCalledWith(5, [21, 20])
    );
  },
};

export const Delete: Story = {
  beforeEach: () => {
    mocked(deleteSceneById).mockResolvedValue(undefined);
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getAllByRole("button", { name: /^Elimina$/ })[0]!
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /elimina/i })
    );
    await waitFor(() => expect(deleteSceneById).toHaveBeenCalledWith(20));
  },
};

export const AddOpensForm: Story = {
  args: { scenes: [] },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Aggiungi scena" })
    );
    await expect(
      await canvas.findByRole("textbox", { name: "Titolo" })
    ).toBeVisible();
  },
};

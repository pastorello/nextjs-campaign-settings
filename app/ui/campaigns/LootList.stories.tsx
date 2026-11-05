import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, screen, waitFor, within } from "storybook/test";

import {
  fightScene,
  magicItemOptions,
  treasureOptions,
} from "@/.storybook/fixtures/campaigns";
import deleteLootById from "@/app/lib/data/campaigns/deleteLootById";
import reorderLoot from "@/app/lib/data/campaigns/reorderLoot";
import setLootTaken from "@/app/lib/data/campaigns/setLootTaken";
import LootList from "./LootList";

/** A scene's loot, each row checked off when taken (SPEC-013 §5.2). */
const meta = {
  component: LootList,
  args: {
    sceneId: 20,
    loot: fightScene.loot,
    currencyUnit: "silver",
    magicItemOptions,
    treasureOptions,
  },
} satisfies Meta<typeof LootList>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvas }) => {
    await expect(canvas.getByText(/borsa di monete/)).toBeVisible();
    await expect(
      canvas.getByRole("button", {
        name: 'Sposta "Una borsa di monete smussate" in alto',
      })
    ).toBeDisabled();
  },
};

export const Empty: Story = {
  args: { loot: [] },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Nessun bottino ancora.")).toBeVisible();
  },
};

export const TakeRow: Story = {
  beforeEach: () => {
    mocked(setLootTaken).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    const [first] = canvas.getAllByRole("checkbox", { name: "Preso" });
    await userEvent.click(first!);
    await waitFor(() => expect(setLootTaken).toHaveBeenCalledWith(40, true));
  },
};

export const Reorder: Story = {
  beforeEach: () => {
    mocked(reorderLoot).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", {
        name: 'Sposta "Una borsa di monete smussate" in basso',
      })
    );
    await waitFor(() => expect(reorderLoot).toHaveBeenCalledWith(20, [41, 40]));
  },
};

export const Delete: Story = {
  beforeEach: () => {
    mocked(deleteLootById).mockResolvedValue(undefined);
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getAllByRole("button", { name: /Elimina/ })[0]!
    );
    const dialog = await screen.findByRole("dialog");
    await userEvent.click(
      within(dialog).getByRole("button", { name: /elimina/i })
    );
    await waitFor(() => expect(deleteLootById).toHaveBeenCalledWith(40));
  },
};

export const AddOpensForm: Story = {
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Aggiungi bottino" })
    );
    await expect(
      await canvas.findByRole("textbox", { name: "Descrizione" })
    ).toBeVisible();
  },
};

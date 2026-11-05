import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import {
  fightScene,
  magicItemOptions,
  treasureOptions,
} from "@/.storybook/fixtures/campaigns";
import createLoot from "@/app/lib/data/campaigns/createLoot";
import updateLoot from "@/app/lib/data/campaigns/updateLoot";
import LootForm from "./LootForm";

/** Adds or edits a loot row of a scene (SPEC-013 §5.3). */
const meta = {
  component: LootForm,
  args: {
    sceneId: 20,
    nextPosition: 3,
    currencyUnit: "silver",
    magicItemOptions,
    treasureOptions,
    onCancel: fn(),
    onSaved: fn(),
  },
} satisfies Meta<typeof LootForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createLoot).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Descrizione" }),
      "Un diario bagnato"
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Aggiungi bottino" })
    );
    await waitFor(() =>
      expect(createLoot).toHaveBeenCalledWith(
        expect.objectContaining({
          sceneId: 20,
          position: 3,
          description: "Un diario bagnato",
        })
      )
    );
    await waitFor(() => expect(args.onSaved).toHaveBeenCalledOnce());
  },
};

export const Edit: Story = {
  args: { loot: fightScene.loot[0]! },
  beforeEach: () => {
    mocked(updateLoot).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await expect(
      canvas.getByRole("textbox", { name: "Descrizione" })
    ).toHaveValue("Una borsa di monete smussate");
    await userEvent.click(
      canvas.getByRole("button", { name: "Salva modifiche" })
    );
    await waitFor(() =>
      expect(updateLoot).toHaveBeenCalledWith(
        expect.objectContaining({ id: 40 })
      )
    );
  },
};

export const Daggerheart: Story = {
  args: {
    rulesSystem: "daggerheart",
    equipmentOptions: {
      weapons: [{ label: "Arpione", value: 1 }],
      armor: [{ label: "Armatura del guardiano", value: 1 }],
      loot: [{ label: "Tonico di brace", value: 1 }],
    },
  },
  play: async ({ canvas }) => {
    await expect(canvas.getByText("Arma")).toBeVisible();
  },
};

export const Cancel: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Annulla" }));
    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};

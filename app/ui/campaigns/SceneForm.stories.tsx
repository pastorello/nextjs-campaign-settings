import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { fightScene, zoneOptions } from "@/.storybook/fixtures/campaigns";
import createScene from "@/app/lib/data/campaigns/createScene";
import updateScene from "@/app/lib/data/campaigns/updateScene";
import SceneForm from "./SceneForm";

/** Adds or edits a scene of an adventure (SPEC-013 §5.3). */
const meta = {
  component: SceneForm,
  args: {
    adventureId: 5,
    nextPosition: 3,
    zoneOptions,
    onCancel: fn(),
    onSaved: fn(),
  },
} satisfies Meta<typeof SceneForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createScene).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Titolo" }),
      "La sala delle campane"
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Aggiungi scena" })
    );
    await waitFor(() =>
      expect(createScene).toHaveBeenCalledWith(
        expect.objectContaining({
          adventureId: 5,
          position: 3,
          title: "La sala delle campane",
        })
      )
    );
    await waitFor(() => expect(args.onSaved).toHaveBeenCalledOnce());
  },
};

export const Edit: Story = {
  args: { scene: fightScene },
  beforeEach: () => {
    mocked(updateScene).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("textbox", { name: "Titolo" })).toHaveValue(
      fightScene.title
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Salva modifiche" })
    );
    await waitFor(() =>
      expect(updateScene).toHaveBeenCalledWith(
        expect.objectContaining({ id: fightScene.id })
      )
    );
  },
};

export const Daggerheart: Story = {
  args: { rulesSystem: "daggerheart" },
  play: async ({ canvas }) => {
    // Daggerheart scenes carry a milestone, not XP.
    await expect(
      canvas.queryByRole("textbox", { name: "PE assegnati" })
    ).not.toBeInTheDocument();
  },
};

export const Cancel: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Annulla" }));
    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};

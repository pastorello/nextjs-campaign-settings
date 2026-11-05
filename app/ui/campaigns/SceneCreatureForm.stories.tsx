import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { fightScene, npcOptions } from "@/.storybook/fixtures/campaigns";
import createSceneCreature from "@/app/lib/data/campaigns/createSceneCreature";
import updateSceneCreature from "@/app/lib/data/campaigns/updateSceneCreature";
import SceneCreatureForm from "./SceneCreatureForm";

/** Adds or edits a creature of a scene (SPEC-013 §5.3). */
const meta = {
  component: SceneCreatureForm,
  args: {
    sceneId: 20,
    nextPosition: 3,
    npcOptions,
    onCancel: fn(),
    onSaved: fn(),
  },
} satisfies Meta<typeof SceneCreatureForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createSceneCreature).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Nome" }),
      "Gabbiano gigante"
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Aggiungi creatura" })
    );
    await waitFor(() =>
      expect(createSceneCreature).toHaveBeenCalledWith(
        expect.objectContaining({
          sceneId: 20,
          position: 3,
          name: "Gabbiano gigante",
        })
      )
    );
    await waitFor(() => expect(args.onSaved).toHaveBeenCalledOnce());
  },
};

export const Edit: Story = {
  args: { creature: fightScene.creatures[0]! },
  beforeEach: () => {
    mocked(updateSceneCreature).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await expect(canvas.getByRole("textbox", { name: "Nome" })).toHaveValue(
      "Predone del passo"
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Salva modifiche" })
    );
    await waitFor(() =>
      expect(updateSceneCreature).toHaveBeenCalledWith(
        expect.objectContaining({ id: 30 })
      )
    );
  },
};

export const Cancel: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Annulla" }));
    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};

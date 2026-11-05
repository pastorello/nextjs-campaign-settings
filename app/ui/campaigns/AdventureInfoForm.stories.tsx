import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { adventure } from "@/.storybook/fixtures/campaigns";
import updateAdventure from "@/app/lib/data/campaigns/updateAdventure";
import AdventureInfoForm from "./AdventureInfoForm";

/** Edits an adventure's own fields and its four budget targets (SPEC-013 §5.3). */
const meta = {
  component: AdventureInfoForm,
  args: { adventure, onCancel: fn(), onSaved: fn() },
  beforeEach: () => {
    mocked(updateAdventure).mockResolvedValue({ ok: true });
  },
} satisfies Meta<typeof AdventureInfoForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Dnd5e: Story = {
  play: async ({ args, canvas, userEvent }) => {
    const title = canvas.getByRole("textbox", { name: "Titolo" });
    await expect(title).toHaveValue(adventure.title);
    await userEvent.clear(title);
    await userEvent.type(title, "Il Passo Ritrovato");
    await userEvent.click(
      canvas.getByRole("button", { name: "Salva modifiche" })
    );
    await waitFor(() =>
      expect(updateAdventure).toHaveBeenCalledWith(
        expect.objectContaining({
          id: adventure.id,
          title: "Il Passo Ritrovato",
        })
      )
    );
    await waitFor(() => expect(args.onSaved).toHaveBeenCalledOnce());
  },
};

export const Daggerheart: Story = {
  args: { rulesSystem: "daggerheart" },
  play: async ({ canvas }) => {
    // Daggerheart has no XP or silver, and a gold target.
    await expect(
      canvas.queryByRole("textbox", { name: "Obiettivo PE" })
    ).not.toBeInTheDocument();
  },
};

export const Cancel: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Annulla" }));
    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};

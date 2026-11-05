import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import createAdventure from "@/app/lib/data/campaigns/createAdventure";
import AdventureForm from "./AdventureForm";

/** Adds an adventure to a campaign's ladder (SPEC-013 §5.2). */
const meta = {
  component: AdventureForm,
  args: { campaignId: 1, nextPosition: 4, onCancel: fn(), onSaved: fn() },
} satisfies Meta<typeof AdventureForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createAdventure).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Titolo" }),
      "La Miniera Cantante"
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Aggiungi avventura" })
    );
    await waitFor(() =>
      expect(createAdventure).toHaveBeenCalledWith(
        expect.objectContaining({
          campaignId: 1,
          position: 4,
          title: "La Miniera Cantante",
        })
      )
    );
    await waitFor(() => expect(args.onSaved).toHaveBeenCalledOnce());
  },
};

export const Cancel: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Annulla" }));
    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};

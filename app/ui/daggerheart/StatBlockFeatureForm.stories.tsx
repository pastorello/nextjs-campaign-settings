import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, waitFor } from "storybook/test";

import StatBlockFeatureForm from "./StatBlockFeatureForm";

const meta = {
  component: StatBlockFeatureForm,
  args: {
    owner: "adversary",
    submitLabel: "Salva privilegio",
    save: fn(() => Promise.resolve({ ok: true as const })),
    onDone: fn(),
  },
} satisfies Meta<typeof StatBlockFeatureForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Adversary: Story = {
  play: async ({ args, canvas, userEvent }) => {
    // Only an adversary's feature has the Fear flag.
    await expect(
      canvas.getByRole("checkbox", { name: /paura/i })
    ).toBeVisible();

    await userEvent.type(
      canvas.getByRole("textbox", { name: /nome/i }),
      "Fiamma"
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Salva privilegio" })
    );

    await waitFor(() =>
      expect(args.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Fiamma", kind: "action", fear: false })
      )
    );
    await expect(args.onDone).toHaveBeenCalledOnce();
  },
};

/** An environment's feature has prompt questions instead of the flag. */
export const Environment: Story = {
  args: {
    owner: "environment",
    initial: { name: "Nebbia Fitta", questions: "<p>Chi si è perso?</p>" },
  },
  play: async ({ canvas }) => {
    await expect(
      canvas.queryByRole("checkbox", { name: /paura/i })
    ).not.toBeInTheDocument();
    await expect(canvas.getByDisplayValue("Nebbia Fitta")).toBeVisible();
  },
};

export const Cancel: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Annulla" }));
    await expect(args.onDone).toHaveBeenCalledOnce();
    await expect(args.save).not.toHaveBeenCalled();
  },
};

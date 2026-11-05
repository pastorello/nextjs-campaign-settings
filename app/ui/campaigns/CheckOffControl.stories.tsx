import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, waitFor } from "storybook/test";

import type MutationResult from "@/app/lib/definitions/types/MutationResult";

import CheckOffControl from "./CheckOffControl";

/** Marks a scene awarded, or a loot row taken (SPEC-013 §5.2). */
const meta = {
  component: CheckOffControl,
  args: {
    label: "Assegnata",
    checked: false,
    errorMessage: "Non è stato possibile aggiornare.",
    onToggle: fn((_next: boolean): Promise<MutationResult> =>
      Promise.resolve({ ok: true })
    ),
  },
} satisfies Meta<typeof CheckOffControl>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Unchecked: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("checkbox", { name: "Assegnata" }));
    await waitFor(() => expect(args.onToggle).toHaveBeenCalledWith(true));
  },
};

export const Checked: Story = {
  args: { checked: true },
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.getByRole("checkbox", { name: "Assegnata" })
    ).toBeChecked();
    await userEvent.click(canvas.getByRole("checkbox", { name: "Assegnata" }));
    await waitFor(() => expect(args.onToggle).toHaveBeenCalledWith(false));
  },
};

export const Refused: Story = {
  args: {
    onToggle: fn((_next: boolean): Promise<MutationResult> =>
      Promise.resolve({
        ok: false,
        errors: { title: [{ key: "tooLong", values: { maximum: 80 } }] },
      })
    ),
  },
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("checkbox", { name: "Assegnata" }));
    await waitFor(() => expect(args.onToggle).toHaveBeenCalledOnce());
  },
};

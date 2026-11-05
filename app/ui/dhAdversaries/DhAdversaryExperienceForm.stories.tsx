import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, waitFor } from "storybook/test";

import DhAdversaryExperienceForm from "./DhAdversaryExperienceForm";

const meta = {
  component: DhAdversaryExperienceForm,
  args: {
    submitLabel: "Salva esperienza",
    save: fn(() => Promise.resolve({ ok: true as const })),
    onDone: fn(),
  },
} satisfies Meta<typeof DhAdversaryExperienceForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Add: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByRole("textbox", { name: "Esperienza" }),
      "Vecchie dimore"
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Salva esperienza" })
    );
    // The bonus is sent as typed (default 2): the action coerces and checks it.
    await waitFor(() =>
      expect(args.save).toHaveBeenCalledWith({
        name: "Vecchie dimore",
        bonus: "2",
      })
    );
    await expect(args.onDone).toHaveBeenCalledOnce();
  },
};

export const Edit: Story = {
  args: { initial: { name: "Sussurri nel camino", bonus: -1 } },
  play: async ({ canvas }) => {
    await expect(canvas.getByDisplayValue("Sussurri nel camino")).toBeVisible();
    await expect(canvas.getByDisplayValue("-1")).toBeVisible();
  },
};

export const Cancel: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Annulla" }));
    await expect(args.onDone).toHaveBeenCalledOnce();
    await expect(args.save).not.toHaveBeenCalled();
  },
};

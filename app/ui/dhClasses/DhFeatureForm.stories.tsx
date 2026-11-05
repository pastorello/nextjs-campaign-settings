import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, waitFor } from "storybook/test";

import DhFeatureForm from "./DhFeatureForm";

const meta = {
  component: DhFeatureForm,
  args: {
    submitLabel: "Salva privilegio",
    save: fn(() => Promise.resolve({ ok: true as const })),
    onCancel: fn(),
    onSaved: fn(),
  },
} satisfies Meta<typeof DhFeatureForm>;

export default meta;
type Story = StoryObj<typeof meta>;

/** A class's feature has a name and text, and no tier. */
export const ClassFeature: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await expect(
      canvas.queryByRole("combobox", { name: /grado/i })
    ).not.toBeInTheDocument();

    await userEvent.type(
      canvas.getByRole("textbox", { name: /nome/i }),
      "Veglia Lunga"
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Salva privilegio" })
    );
    await waitFor(() =>
      expect(args.save).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Veglia Lunga" })
      )
    );
    await expect(args.onSaved).toHaveBeenCalledOnce();
  },
};

/** A subclass's feature also picks its tier. */
export const SubclassFeature: Story = {
  args: { withTier: true, initial: { name: "Sentinella" } },
  play: async ({ canvas }) => {
    await expect(canvas.getByDisplayValue("Sentinella")).toBeVisible();
    await expect(
      canvas.getByRole("button", { name: "Grado" })
    ).toHaveTextContent("Fondamento");
  },
};

export const Cancel: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Annulla" }));
    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};

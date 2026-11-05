import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { lanternWraith } from "@/.storybook/fixtures/daggerheart";
import createDhAdversary from "@/app/lib/data/dhAdversaries/createDhAdversary";
import updateDhAdversary from "@/app/lib/data/dhAdversaries/updateDhAdversary";
import DhAdversaryForm from "./DhAdversaryForm";

/** The create and update actions are Server Actions, so spies here (ADR-0021). */
const meta = {
  component: DhAdversaryForm,
  args: {
    onCancel: fn(),
    onSaveFinished: fn(),
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DhAdversaryForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createDhAdversary).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    const submit = canvas.getByRole("button", { name: "Crea avversario" });
    await expect(submit).toBeDisabled();

    await userEvent.type(
      canvas.getByRole("textbox", { name: "Nome" }),
      "Nuovo nome"
    );
    await userEvent.click(submit);

    await waitFor(() =>
      expect(createDhAdversary).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Nuovo nome" })
      )
    );
    await expect(args.onSaveFinished).toHaveBeenCalledOnce();
  },
};

export const Edit: Story = {
  // TD-158: an h3 "Esperienze" follows the form's h1 (heading-order).
  parameters: { a11y: { test: "todo" } },
  args: { formData: lanternWraith },
  beforeEach: () => {
    mocked(updateDhAdversary).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    const name = canvas.getByRole("textbox", { name: "Nome" });
    await expect(name).toHaveValue(lanternWraith.name);

    await userEvent.clear(name);
    await userEvent.type(name, "Nome nuovo");
    await userEvent.click(
      canvas.getByRole("button", { name: "Salva avversario" })
    );

    // An edit sends the id and the edited fields only.
    await waitFor(() =>
      expect(updateDhAdversary).toHaveBeenCalledWith({
        id: lanternWraith.id,
        name: "Nome nuovo",
      })
    );
  },
};

export const Cancel: Story = {
  play: async ({ args, canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: "Annulla" }));
    await expect(args.onCancel).toHaveBeenCalledOnce();
  },
};

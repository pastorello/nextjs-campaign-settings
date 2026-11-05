import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { fogHarbour, dhOptions } from "@/.storybook/fixtures/daggerheart";
import createDhEnvironment from "@/app/lib/data/dhEnvironments/createDhEnvironment";
import updateDhEnvironment from "@/app/lib/data/dhEnvironments/updateDhEnvironment";
import DhEnvironmentForm from "./DhEnvironmentForm";

/** The create and update actions are Server Actions, so spies here (ADR-0021). */
const meta = {
  component: DhEnvironmentForm,
  args: {
    onCancel: fn(),
    onSaveFinished: fn(),
    optionBundle: dhOptions,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DhEnvironmentForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createDhEnvironment).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    const submit = canvas.getByRole("button", { name: "Crea ambiente" });
    await expect(submit).toBeDisabled();

    await userEvent.type(
      canvas.getByRole("textbox", { name: "Nome" }),
      "Nuovo nome"
    );
    await userEvent.click(submit);

    await waitFor(() =>
      expect(createDhEnvironment).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Nuovo nome" })
      )
    );
    await expect(args.onSaveFinished).toHaveBeenCalledOnce();
  },
};

export const Edit: Story = {
  // TD-158: an h3 follows the form's h1 (heading-order).
  parameters: { a11y: { test: "todo" } },
  args: { formData: fogHarbour },
  beforeEach: () => {
    mocked(updateDhEnvironment).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    const name = canvas.getByRole("textbox", { name: "Nome" });
    await expect(name).toHaveValue(fogHarbour.name);

    await userEvent.clear(name);
    await userEvent.type(name, "Nome nuovo");
    await userEvent.click(
      canvas.getByRole("button", { name: "Salva ambiente" })
    );

    // An edit sends the id and the edited fields only.
    await waitFor(() =>
      expect(updateDhEnvironment).toHaveBeenCalledWith({
        id: fogHarbour.id,
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

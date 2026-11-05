import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { emberDomain } from "@/.storybook/fixtures/daggerheart";
import createDhDomain from "@/app/lib/data/dhDomains/createDhDomain";
import updateDhDomain from "@/app/lib/data/dhDomains/updateDhDomain";
import DhDomainForm from "./DhDomainForm";

/** The create and update actions are Server Actions, so spies here (ADR-0021). */
const meta = {
  component: DhDomainForm,
  args: {
    onCancel: fn(),
    onSaveFinished: fn(),
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DhDomainForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createDhDomain).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    const submit = canvas.getByRole("button", { name: "Crea dominio" });
    await expect(submit).toBeDisabled();

    await userEvent.type(
      canvas.getByRole("textbox", { name: "Nome" }),
      "Nuovo nome"
    );
    await userEvent.click(submit);

    await waitFor(() =>
      expect(createDhDomain).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Nuovo nome" })
      )
    );
    await expect(args.onSaveFinished).toHaveBeenCalledOnce();
  },
};

export const Edit: Story = {
  args: { formData: emberDomain },
  beforeEach: () => {
    mocked(updateDhDomain).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    const name = canvas.getByRole("textbox", { name: "Nome" });
    await expect(name).toHaveValue(emberDomain.name);

    await userEvent.clear(name);
    await userEvent.type(name, "Nome nuovo");
    await userEvent.click(
      canvas.getByRole("button", { name: "Modifica dominio" })
    );

    // An edit sends the id and the edited fields only.
    await waitFor(() =>
      expect(updateDhDomain).toHaveBeenCalledWith({
        id: emberDomain.id,
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

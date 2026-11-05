import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, fn, mocked, waitFor } from "storybook/test";

import { lanternCard, dhOptions } from "@/.storybook/fixtures/daggerheart";
import createDhDomainCard from "@/app/lib/data/dhDomainCards/createDhDomainCard";
import updateDhDomainCard from "@/app/lib/data/dhDomainCards/updateDhDomainCard";
import DhDomainCardForm from "./DhDomainCardForm";

/** The create and update actions are Server Actions, so spies here (ADR-0021). */
const meta = {
  component: DhDomainCardForm,
  args: {
    onCancel: fn(),
    onSaveFinished: fn(),
    optionBundle: dhOptions,
  },
  parameters: { layout: "fullscreen" },
} satisfies Meta<typeof DhDomainCardForm>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Create: Story = {
  beforeEach: () => {
    mocked(createDhDomainCard).mockResolvedValue({ ok: true });
  },
  play: async ({ args, canvas, userEvent }) => {
    const submit = canvas.getByRole("button", { name: "Crea carta dominio" });
    await expect(submit).toBeDisabled();

    await userEvent.type(
      canvas.getByRole("textbox", { name: "Nome" }),
      "Nuovo nome"
    );
    await userEvent.click(submit);

    await waitFor(() =>
      expect(createDhDomainCard).toHaveBeenCalledWith(
        expect.objectContaining({ name: "Nuovo nome" })
      )
    );
    await expect(args.onSaveFinished).toHaveBeenCalledOnce();
  },
};

export const Edit: Story = {
  args: { formData: lanternCard },
  beforeEach: () => {
    mocked(updateDhDomainCard).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    const name = canvas.getByRole("textbox", { name: "Nome" });
    await expect(name).toHaveValue(lanternCard.name);

    await userEvent.clear(name);
    await userEvent.type(name, "Nome nuovo");
    await userEvent.click(
      canvas.getByRole("button", { name: "Modifica carta dominio" })
    );

    // An edit sends the id and the edited fields only.
    await waitFor(() =>
      expect(updateDhDomainCard).toHaveBeenCalledWith({
        id: lanternCard.id,
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

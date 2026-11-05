import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";

import changeOwnPassword from "@/app/lib/data/accounts/changeOwnPassword";
import updateOwnName from "@/app/lib/data/accounts/updateOwnName";
import OwnAccountForms from "./OwnAccountForms";

/** The signed-in DM's own name and password (SPEC-022 T2). */
const meta = {
  component: OwnAccountForms,
  args: { name: "Mara Venti", email: "mara@example.test" },
} satisfies Meta<typeof OwnAccountForms>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const WrongCurrentPassword: Story = {
  beforeEach: () => {
    mocked(changeOwnPassword).mockResolvedValue({
      ok: false,
      errors: { currentPassword: [{ key: "invalid" }] },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(
      canvas.getByLabelText("Password attuale"),
      "sbagliata"
    );
    await userEvent.type(
      canvas.getByLabelText("Nuova password"),
      "una-frase-lunga"
    );
    await userEvent.click(
      canvas.getByRole("button", { name: "Cambia la password" })
    );
    await waitFor(() => expect(changeOwnPassword).toHaveBeenCalled());
  },
};

export const NameSaved: Story = {
  beforeEach: () => {
    mocked(updateOwnName).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Salva il nome" })
    );
    await waitFor(() =>
      expect(updateOwnName).toHaveBeenCalledWith({ name: "Mara Venti" })
    );
  },
};

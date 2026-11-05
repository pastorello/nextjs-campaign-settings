import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, waitFor } from "storybook/test";

import createAccount from "@/app/lib/data/accounts/createAccount";
import NewAccountForm from "./NewAccountForm";

/** The DM creates an account and tells the first password (SPEC-022 T3). */
const meta = { component: NewAccountForm } satisfies Meta<
  typeof NewAccountForm
>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Empty: Story = {};

export const Created: Story = {
  beforeEach: () => {
    mocked(createAccount).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.type(canvas.getByLabelText("Nome"), "Tobia Ferri");
    await userEvent.type(canvas.getByLabelText("Email"), "t@example.test");
    await userEvent.type(canvas.getByLabelText("Password"), "una-frase-lunga");
    await userEvent.click(
      canvas.getByRole("button", { name: "Crea l'account" })
    );
    await waitFor(() =>
      expect(createAccount).toHaveBeenCalledWith({
        name: "Tobia Ferri",
        email: "t@example.test",
        password: "una-frase-lunga",
        role: "player",
      })
    );
  },
};

export const Refused: Story = {
  beforeEach: () => {
    mocked(createAccount).mockResolvedValue({
      ok: false,
      errors: { email: [{ key: "invalidFormat" }] },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: "Crea l'account" })
    );
    await waitFor(() => expect(createAccount).toHaveBeenCalled());
  },
};

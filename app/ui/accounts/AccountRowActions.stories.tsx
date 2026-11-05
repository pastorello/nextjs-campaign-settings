import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { expect, mocked, screen, waitFor } from "storybook/test";

import deleteAccount from "@/app/lib/data/accounts/deleteAccount";
import setAccountActive from "@/app/lib/data/accounts/setAccountActive";
import setAccountPassword from "@/app/lib/data/accounts/setAccountPassword";
import updateAccount from "@/app/lib/data/accounts/updateAccount";
import AccountRowActions from "./AccountRowActions";

/**
 * One account's actions: edit, set a password, disable or activate, delete
 * (SPEC-022 T3). Each button names the account.
 */
const meta = {
  component: AccountRowActions,
  args: {
    account: {
      id: "player-1",
      name: "Tobia Ferri",
      email: "tobia@example.test",
      role: "player",
      active: true,
    },
  },
} satisfies Meta<typeof AccountRowActions>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Active: Story = {};

export const Inactive: Story = {
  args: { account: { ...meta.args.account, active: false } },
  beforeEach: () => {
    mocked(setAccountActive).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Attiva/ }));
    await waitFor(() =>
      expect(setAccountActive).toHaveBeenCalledWith({
        id: "player-1",
        active: true,
      })
    );
  },
};

export const EditDialog: Story = {
  beforeEach: () => {
    mocked(updateAccount).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Modifica/ }));
    await expect(await screen.findByRole("dialog")).toBeVisible();
    await userEvent.click(screen.getByRole("button", { name: "Salva" }));
    await waitFor(() =>
      expect(updateAccount).toHaveBeenCalledWith({
        id: "player-1",
        name: "Tobia Ferri",
        role: "player",
      })
    );
  },
};

export const PasswordDialogRefused: Story = {
  beforeEach: () => {
    mocked(setAccountPassword).mockResolvedValue({
      ok: false,
      errors: { password: [{ key: "tooShort", values: { minimum: 8 } }] },
    });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(
      canvas.getByRole("button", { name: /Nuova password per/ })
    );
    await userEvent.type(await screen.findByLabelText("Password"), "x");
    await userEvent.click(screen.getByRole("button", { name: "Salva" }));
    await waitFor(() => expect(setAccountPassword).toHaveBeenCalled());
  },
};

export const DeleteDialog: Story = {
  beforeEach: () => {
    mocked(deleteAccount).mockResolvedValue({ ok: true });
  },
  play: async ({ canvas, userEvent }) => {
    await userEvent.click(canvas.getByRole("button", { name: /Elimina/ }));
    await expect(await screen.findByRole("dialog")).toBeVisible();
  },
};

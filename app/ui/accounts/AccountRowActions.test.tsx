import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const mocks = vi.hoisted(() => ({
  updateAccount: vi.fn(),
  setAccountActive: vi.fn(),
  setAccountPassword: vi.fn(),
  deleteAccount: vi.fn(),
  notifySuccess: vi.fn(),
  notifyError: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("@/app/lib/data/accounts/updateAccount", () => ({
  default: mocks.updateAccount,
}));
vi.mock("@/app/lib/data/accounts/setAccountActive", () => ({
  default: mocks.setAccountActive,
}));
vi.mock("@/app/lib/data/accounts/setAccountPassword", () => ({
  default: mocks.setAccountPassword,
}));
vi.mock("@/app/lib/data/accounts/deleteAccount", () => ({
  default: mocks.deleteAccount,
}));
vi.mock("@/app/lib/notifications/notify", () => ({
  notifySuccess: mocks.notifySuccess,
  notifyError: mocks.notifyError,
}));
vi.mock("@/i18n/navigation", () => ({
  useRouter: () => ({ refresh: mocks.refresh }),
}));
vi.mock("@/app/ui/forms/inputs/Select", async () => ({
  default: (await import("./SelectStub.testkit")).default,
}));

import AccountRowActions from "./AccountRowActions";

const account = {
  id: "7f0c1a52-3a51-4f5e-9d8b-2d6f1f7e9a10",
  name: "Mira",
  email: "mira@example.test",
  role: "player" as const,
  active: true,
};

describe("AccountRowActions (SPEC-022 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    for (const action of [
      mocks.updateAccount,
      mocks.setAccountActive,
      mocks.setAccountPassword,
      mocks.deleteAccount,
    ]) {
      action.mockResolvedValue({ ok: true });
    }
  });

  it("names the account on every button", () => {
    render(<AccountRowActions account={account} />);

    for (const name of [
      "page.edit",
      "page.setPassword",
      "page.disable",
      "page.delete",
    ]) {
      expect(screen.getByRole("button", { name })).toBeInTheDocument();
    }
  });

  it("edits the name and role in a dialog", async () => {
    render(<AccountRowActions account={account} />);

    fireEvent.click(screen.getByRole("button", { name: "page.edit" }));
    fireEvent.change(await screen.findByLabelText("page.name"), {
      target: { value: "Mira Vell" },
    });
    fireEvent.change(screen.getByLabelText("page.role"), {
      target: { value: "dm" },
    });
    fireEvent.click(screen.getByRole("button", { name: "page.save" }));

    await waitFor(() =>
      expect(mocks.updateAccount).toHaveBeenCalledWith({
        id: account.id,
        name: "Mira Vell",
        role: "dm",
      })
    );
    expect(mocks.notifySuccess).toHaveBeenCalledWith("page.saved");
    expect(mocks.refresh).toHaveBeenCalled();
  });

  it("keeps a refused edit's error in its dialog", async () => {
    mocks.updateAccount.mockResolvedValue({
      ok: false,
      errors: { role: [{ key: "lastActiveDm" }] },
    });
    render(<AccountRowActions account={account} />);

    fireEvent.click(screen.getByRole("button", { name: "page.edit" }));
    fireEvent.click(await screen.findByRole("button", { name: "page.save" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "page.role: common.fieldErrors.lastActiveDm"
    );
    expect(mocks.refresh).not.toHaveBeenCalled();
  });

  it("sets a new password", async () => {
    render(<AccountRowActions account={account} />);

    fireEvent.click(screen.getByRole("button", { name: "page.setPassword" }));
    const input = await screen.findByLabelText("page.password");
    expect(input).toHaveAttribute("type", "password");
    fireEvent.change(input, { target: { value: "long enough" } });
    fireEvent.click(screen.getByRole("button", { name: "page.save" }));

    await waitFor(() =>
      expect(mocks.setAccountPassword).toHaveBeenCalledWith({
        id: account.id,
        password: "long enough",
      })
    );
    expect(mocks.notifySuccess).toHaveBeenCalledWith("page.passwordSet");
  });

  it("disables an active account, and toasts a refusal", async () => {
    mocks.setAccountActive.mockResolvedValue({
      ok: false,
      errors: { active: [{ key: "lastActiveDm" }] },
    });
    render(<AccountRowActions account={account} />);

    fireEvent.click(screen.getByRole("button", { name: "page.disable" }));

    await waitFor(() =>
      expect(mocks.setAccountActive).toHaveBeenCalledWith({
        id: account.id,
        active: false,
      })
    );
    expect(mocks.notifyError).toHaveBeenCalledWith(
      "common.fieldErrors.lastActiveDm"
    );
  });

  it("offers to activate a disabled account", async () => {
    render(<AccountRowActions account={{ ...account, active: false }} />);

    fireEvent.click(screen.getByRole("button", { name: "page.activate" }));

    await waitFor(() =>
      expect(mocks.setAccountActive).toHaveBeenCalledWith({
        id: account.id,
        active: true,
      })
    );
    expect(mocks.notifySuccess).toHaveBeenCalledWith("page.activated");
  });

  it("deletes only after the confirmation", async () => {
    render(<AccountRowActions account={account} />);

    fireEvent.click(screen.getByRole("button", { name: "page.delete" }));
    expect(mocks.deleteAccount).not.toHaveBeenCalled();
    fireEvent.click(
      await screen.findByRole("button", { name: "page.confirmDelete" })
    );

    await waitFor(() =>
      expect(mocks.deleteAccount).toHaveBeenCalledWith({ id: account.id })
    );
    expect(mocks.notifySuccess).toHaveBeenCalledWith("page.deleted");
  });
});

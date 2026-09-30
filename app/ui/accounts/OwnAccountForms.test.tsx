import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { updateOwnName, changeOwnPassword, notifySuccess, notifyError } =
  vi.hoisted(() => ({
    updateOwnName: vi.fn(),
    changeOwnPassword: vi.fn(),
    notifySuccess: vi.fn(),
    notifyError: vi.fn(),
  }));
vi.mock("@/app/lib/data/accounts/updateOwnName", () => ({
  default: updateOwnName,
}));
vi.mock("@/app/lib/data/accounts/changeOwnPassword", () => ({
  default: changeOwnPassword,
}));
vi.mock("@/app/lib/notifications/notify", () => ({
  notifySuccess,
  notifyError,
}));

import OwnAccountForms from "./OwnAccountForms";

describe("OwnAccountForms (SPEC-022 T2)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    updateOwnName.mockResolvedValue({ ok: true });
    changeOwnPassword.mockResolvedValue({ ok: true });
  });

  it("renames the account", async () => {
    render(<OwnAccountForms name="Mira" email="mira@example.test" />);

    fireEvent.change(screen.getByLabelText("ownPage.name"), {
      target: { value: "Mira Vell" },
    });
    fireEvent.click(screen.getByRole("button", { name: "ownPage.saveName" }));

    await waitFor(() =>
      expect(updateOwnName).toHaveBeenCalledWith({ name: "Mira Vell" })
    );
    expect(notifySuccess).toHaveBeenCalledWith("ownPage.nameSaved");
  });

  it("shows the email without offering to edit it", () => {
    render(<OwnAccountForms name="Mira" email="mira@example.test" />);

    expect(screen.getByText(/mira@example.test/)).toBeInTheDocument();
    expect(screen.queryByLabelText("ownPage.email")).not.toBeInTheDocument();
  });

  it("changes the password behind the current one, then clears both fields", async () => {
    render(<OwnAccountForms name="Mira" email="mira@example.test" />);

    const current = screen.getByLabelText("ownPage.currentPassword");
    const next = screen.getByLabelText("ownPage.newPassword");
    expect(current).toHaveAttribute("type", "password");
    fireEvent.change(current, { target: { value: "old secret" } });
    fireEvent.change(next, { target: { value: "new secret" } });
    fireEvent.click(
      screen.getByRole("button", { name: "ownPage.changePassword" })
    );

    await waitFor(() =>
      expect(changeOwnPassword).toHaveBeenCalledWith({
        currentPassword: "old secret",
        newPassword: "new secret",
      })
    );
    await waitFor(() => expect(current).toHaveValue(""));
    expect(next).toHaveValue("");
    expect(notifySuccess).toHaveBeenCalledWith("ownPage.passwordChanged");
  });

  it("shows a wrong current password beside its field's name", async () => {
    changeOwnPassword.mockResolvedValue({
      ok: false,
      errors: { currentPassword: [{ key: "wrongPassword" }] },
    });
    render(<OwnAccountForms name="Mira" email="mira@example.test" />);

    fireEvent.click(
      screen.getByRole("button", { name: "ownPage.changePassword" })
    );

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "ownPage.currentPassword: common.fieldErrors.wrongPassword"
    );
    expect(notifySuccess).not.toHaveBeenCalled();
  });

  it("notifies when the action throws", async () => {
    updateOwnName.mockRejectedValue(new Error("boom"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    render(<OwnAccountForms name="Mira" email="mira@example.test" />);

    fireEvent.click(screen.getByRole("button", { name: "ownPage.saveName" }));

    await waitFor(() => expect(notifyError).toHaveBeenCalledWith("failed"));
    consoleError.mockRestore();
  });
});

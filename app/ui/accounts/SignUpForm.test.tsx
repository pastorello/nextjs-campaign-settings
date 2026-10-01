import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { requestDmAccount, notifyError } = vi.hoisted(() => ({
  requestDmAccount: vi.fn(),
  notifyError: vi.fn(),
}));
vi.mock("@/app/lib/data/accounts/requestDmAccount", () => ({
  default: requestDmAccount,
}));
vi.mock("@/app/lib/notifications/notify", () => ({ notifyError }));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, ...props }: React.ComponentProps<"a">) => (
    <a href={href} {...props} />
  ),
}));

import SignUpForm from "./SignUpForm";

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("SignUpForm (SPEC-022 T4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    requestDmAccount.mockResolvedValue({ ok: true });
  });

  it("asks for the account, then says it waits for a DM", async () => {
    render(<SignUpForm />);

    fill("name", "Aldo");
    fill("email", "aldo@example.test");
    fill("password", "long enough");
    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() =>
      expect(requestDmAccount).toHaveBeenCalledWith({
        name: "Aldo",
        email: "aldo@example.test",
        password: "long enough",
      })
    );
    expect(
      await screen.findByRole("heading", { name: "doneTitle" })
    ).toBeInTheDocument();
    expect(screen.getByText("doneBody")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "backToLogin" })).toHaveAttribute(
      "href",
      "/login"
    );
  });

  it("hides what is typed in the password field", () => {
    render(<SignUpForm />);

    expect(screen.getByLabelText("password")).toHaveAttribute(
      "type",
      "password"
    );
  });

  it("names a malformed field and keeps the form", async () => {
    requestDmAccount.mockResolvedValue({
      ok: false,
      errors: { password: [{ key: "tooShort", values: { minimum: 8 } }] },
    });
    render(<SignUpForm />);

    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "password: common.fieldErrors.tooShort"
    );
    expect(
      screen.queryByRole("heading", { name: "doneTitle" })
    ).not.toBeInTheDocument();
  });

  it("notifies when the request fails outright", async () => {
    requestDmAccount.mockRejectedValue(new Error("boom"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    render(<SignUpForm />);

    fireEvent.click(screen.getByRole("button", { name: "submit" }));

    await waitFor(() => expect(notifyError).toHaveBeenCalledWith("failed"));
    consoleError.mockRestore();
  });
});

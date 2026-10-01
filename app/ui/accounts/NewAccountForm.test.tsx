import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

const { createAccount, notifySuccess, refresh } = vi.hoisted(() => ({
  createAccount: vi.fn(),
  notifySuccess: vi.fn(),
  refresh: vi.fn(),
}));
vi.mock("@/app/lib/data/accounts/createAccount", () => ({
  default: createAccount,
}));
vi.mock("@/app/lib/notifications/notify", () => ({
  notifySuccess,
  notifyError: vi.fn(),
}));
vi.mock("@/i18n/navigation", () => ({ useRouter: () => ({ refresh }) }));
vi.mock("@/app/ui/forms/inputs/Select", async () => ({
  default: (await import("./SelectStub.testkit")).default,
}));

import NewAccountForm from "./NewAccountForm";

function fill(label: string, value: string) {
  fireEvent.change(screen.getByLabelText(label), { target: { value } });
}

describe("NewAccountForm (SPEC-022 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    createAccount.mockResolvedValue({ ok: true });
  });

  it("creates a player by default, then clears and refreshes", async () => {
    render(<NewAccountForm />);

    fill("page.name", "Mira");
    fill("page.email", "mira@example.test");
    fill("page.password", "long enough");
    fireEvent.click(screen.getByRole("button", { name: "page.create" }));

    await waitFor(() =>
      expect(createAccount).toHaveBeenCalledWith({
        name: "Mira",
        email: "mira@example.test",
        password: "long enough",
        role: "player",
      })
    );
    expect(notifySuccess).toHaveBeenCalledWith("page.created");
    expect(refresh).toHaveBeenCalled();
    await waitFor(() =>
      expect(screen.getByLabelText("page.name")).toHaveValue("")
    );
  });

  it("creates a DM when the role says so", async () => {
    render(<NewAccountForm />);

    fill("page.role", "dm");
    fireEvent.click(screen.getByRole("button", { name: "page.create" }));

    await waitFor(() =>
      expect(createAccount).toHaveBeenCalledWith(
        expect.objectContaining({ role: "dm" })
      )
    );
  });

  it("keeps what was typed and names the field of a refusal", async () => {
    createAccount.mockResolvedValue({
      ok: false,
      errors: { email: [{ key: "emailTaken" }] },
    });
    render(<NewAccountForm />);

    fill("page.name", "Mira");
    fireEvent.click(screen.getByRole("button", { name: "page.create" }));

    expect(await screen.findByRole("alert")).toHaveTextContent(
      "page.email: common.fieldErrors.emailTaken"
    );
    expect(screen.getByLabelText("page.name")).toHaveValue("Mira");
    expect(refresh).not.toHaveBeenCalled();
  });
});

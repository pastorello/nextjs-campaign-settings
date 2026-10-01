import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

const { requireDmPage } = vi.hoisted(() => ({ requireDmPage: vi.fn() }));
vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));
vi.mock("@/auth", () => ({
  auth: () => Promise.resolve({ user: { id: "me", role: "dm" } }),
}));
vi.mock("@/app/lib/auth/requireDmPage", () => ({ default: requireDmPage }));
vi.mock("@/app/lib/data/accounts/fetchAccounts", () => ({
  default: () =>
    Promise.resolve([
      { id: "me", name: "Aldo", email: "a@x.test", role: "dm", active: true },
    ]),
}));
vi.mock("@/app/ui/accounts/NewAccountForm", () => ({
  default: () => <form aria-label="new account" />,
}));
vi.mock("@/app/ui/accounts/AccountsTable", () => ({
  default: ({
    accounts,
    currentUserId,
  }: {
    accounts: { name: string }[];
    currentUserId: string;
  }) => (
    <p>
      {accounts.length} accounts, signed in as {currentUserId}
    </p>
  ),
}));

import AccountsPage from "./page";

describe("AccountsPage (SPEC-022 T3)", () => {
  it("guards itself, then shows the form and the accounts", async () => {
    render(await AccountsPage());

    expect(requireDmPage).toHaveBeenCalled();
    expect(screen.getByRole("heading", { name: "title" })).toBeInTheDocument();
    expect(
      screen.getByRole("form", { name: "new account" })
    ).toBeInTheDocument();
    expect(screen.getByText("1 accounts, signed in as me")).toBeInTheDocument();
  });
});

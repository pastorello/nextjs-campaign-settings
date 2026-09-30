import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));
vi.mock("./AccountRowActions", () => ({
  default: ({ account }: { account: { name: string } }) => (
    <span>actions for {account.name}</span>
  ),
}));

import AccountsTable from "./AccountsTable";

const accounts = [
  {
    id: "a",
    name: "Aldo",
    email: "aldo@example.test",
    role: "dm" as const,
    active: true,
  },
  {
    id: "b",
    name: "Bea",
    email: "bea@example.test",
    role: "player" as const,
    active: false,
  },
];

describe("AccountsTable (SPEC-022 T3)", () => {
  it("shows each account's email, role and status, with its actions", async () => {
    render(await AccountsTable({ accounts, currentUserId: "a" }));

    const bea = screen.getByRole("row", { name: /Bea/ });
    expect(within(bea).getByText("bea@example.test")).toBeInTheDocument();
    expect(within(bea).getByText("roles.player")).toBeInTheDocument();
    expect(within(bea).getByText("statuses.inactive")).toBeInTheDocument();
    expect(within(bea).getByText("actions for Bea")).toBeInTheDocument();
  });

  it("marks the signed-in account", async () => {
    render(await AccountsTable({ accounts, currentUserId: "a" }));

    expect(
      within(screen.getByRole("row", { name: /Aldo/ })).getByText("page.you")
    ).toBeInTheDocument();
    expect(
      within(screen.getByRole("row", { name: /Bea/ })).queryByText("page.you")
    ).not.toBeInTheDocument();
  });
});

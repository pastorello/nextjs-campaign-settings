import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

// This suite is about AdminListHeader's own layout and props wiring — the
// child controls each have their own suite — so they are stubbed.
vi.mock("../search", () => ({
  default: ({ placeholder }: { placeholder: string }) => (
    <div data-testid="search">{placeholder}</div>
  ),
}));
vi.mock("../buttons/ResetSearchButton", () => ({
  ResetButton: () => <button>reset</button>,
}));
vi.mock("../buttons/BaseButton", () => ({
  default: ({ children, to }: { children: React.ReactNode; to?: string }) => (
    <a href={to}>{children}</a>
  ),
}));

import AdminListHeader from "./AdminListHeader";

describe("AdminListHeader", () => {
  it("renders the search placeholder, the count text and the new-item link", () => {
    render(
      <AdminListHeader
        searchPlaceholder="Cerca..."
        countText="6 di 361 incantesimi trovati"
        newItemHref="spells/new"
        newItemLabel="Nuovo Incantesimo"
      />
    );

    expect(screen.getByTestId("search")).toHaveTextContent("Cerca...");
    expect(
      screen.getByText("6 di 361 incantesimi trovati")
    ).toBeInTheDocument();
    expect(
      screen.getByRole("link", { name: "Nuovo Incantesimo" })
    ).toHaveAttribute("href", "spells/new");
    expect(screen.getByRole("button", { name: "reset" })).toBeInTheDocument();
  });

  // TD-135 put the count in a live region; extracting this header (TD-114)
  // dropped it for every admin list until 2026-09-17.
  it("announces the count in a status region", () => {
    render(
      <AdminListHeader
        searchPlaceholder="Cerca..."
        countText="6 di 361 incantesimi trovati"
        newItemHref="spells/new"
        newItemLabel="Nuovo Incantesimo"
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent(
      "6 di 361 incantesimi trovati"
    );
  });
});

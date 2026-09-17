import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: () =>
    Promise.resolve((key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key
    ),
}));

// This suite is about ListPage's own layout — the count and its role=status
// wrapper — so the child controls (each with their own suite) are stubbed.
vi.mock("../search", () => ({
  default: () => <div data-testid="search" />,
}));
vi.mock("../buttons/ResetSearchButton", () => ({
  ResetButton: () => <button>reset</button>,
}));
vi.mock("../components/pagination", () => ({
  default: () => <div data-testid="pagination" />,
}));
vi.mock("../buttons/BaseButton", () => ({
  default: ({ children }: { children: React.ReactNode }) => (
    <button>{children}</button>
  ),
}));

import { ListPage } from "./ListPage";

describe("ListPage", () => {
  // TD-135: the "N of M items found" counter changes as the DM types or
  // filters, with nothing telling a screen reader it changed at all.
  it("puts the item count in a role=status element", async () => {
    render(
      await ListPage({
        title: "Spells",
        searchPlaceholder: "Search...",
        itemCount: {
          total: 361,
          filtered: 6,
          totalPages: 13,
          filteredPages: 1,
        },
        itemNamePlural: "spells",
        itemNameSingular: "spell",
        children: null,
      })
    );

    const status = screen.getByRole("status");
    expect(status).toHaveTextContent(
      'count:{"filtered":6,"total":361,"item":"spells"}'
    );
  });
});

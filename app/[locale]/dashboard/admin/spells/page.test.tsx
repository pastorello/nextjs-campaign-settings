import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";

// Representative of the admin list-page pattern shared by admin/deities,
// admin/magicitems and admin/npc: a generateMetadata call, an item-count
// fetch, and composition of Search/BaseButton/ResetButton/EntityList/
// Pagination around a "new" route. One domain covers the shape (TD-45).

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

const getSpellsCount = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/spells/getSpellsCount", () => ({
  getSpellsCount: (...args: unknown[]) => getSpellsCount(...args),
}));

vi.mock("@/app/ui/components/pagination", () => ({
  default: ({ totalPages }: { totalPages: number }) => (
    <div data-testid="pagination">{totalPages}</div>
  ),
}));
vi.mock("@/app/ui/search", () => ({
  default: ({ placeholder }: { placeholder: string }) => (
    <input data-testid="search" placeholder={placeholder} />
  ),
}));
vi.mock("@/app/ui/buttons/BaseButton", () => ({
  default: ({ to, children }: { to: string; children: React.ReactNode }) => (
    <a href={to}>{children}</a>
  ),
}));
vi.mock("@/app/ui/buttons/ResetSearchButton", () => ({
  ResetButton: () => <button>reset</button>,
}));
vi.mock("@/app/ui/components/EntityList", () => ({
  default: ({ pageType }: { pageType: PageType }) => (
    <div data-testid="entity-list">{pageType}</div>
  ),
}));

import Page, { generateMetadata } from "./page";

describe("admin spells Page (admin list-page pattern)", () => {
  it("titles the page from the spells.page catalogue", async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe("title");
  });

  it("fetches the item count, links the new-item button, and renders EntityList + Pagination for Spell", async () => {
    getSpellsCount.mockResolvedValue({
      filtered: 2,
      total: 5,
      filteredPages: 4,
    });
    const searchParams = Promise.resolve({ query: "acid", page: "2" });

    render(await Page({ searchParams }));

    expect(getSpellsCount).toHaveBeenCalledWith({ query: "acid", page: "2" });
    expect(screen.getByText("newItemButton").closest("a")).toHaveAttribute(
      "href",
      "spells/new"
    );
    expect(screen.getByTestId("entity-list")).toHaveTextContent(PageType.Spell);
    expect(screen.getByTestId("pagination")).toHaveTextContent("4");
  });

  it("falls back to an empty search and page 1 when searchParams is undefined", async () => {
    getSpellsCount.mockResolvedValue({
      filtered: 0,
      total: 0,
      filteredPages: 0,
    });

    render(await Page({}));

    expect(getSpellsCount).toHaveBeenCalledWith({});
  });
});

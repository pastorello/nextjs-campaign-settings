import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";

// Representative of the public list-page pattern shared by deities/,
// magicitems/ and npc/ under app/[locale]/dashboard/**: a generateMetadata
// call, an item-count fetch, and composition of ListPage + EntityLibrary.
// One domain covers the shape; the others differ only in their own already-
// tested data/UI pieces (TD-45).

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

const getSpellsCount = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/spells/getSpellsCount", () => ({
  getSpellsCount: (...args: unknown[]) => getSpellsCount(...args),
}));

vi.mock("@/app/ui/containers/ListPage", () => ({
  ListPage: ({
    title,
    itemCount,
    children,
  }: {
    title: string;
    itemCount: { filtered: number; total: number };
    children: React.ReactNode;
  }) => (
    <div
      data-testid="list-page"
      data-count={`${itemCount.filtered}/${itemCount.total}`}
    >
      <h1>{title}</h1>
      {children}
    </div>
  ),
}));

vi.mock("@/app/ui/components/EntityLibrary", () => ({
  default: ({ pageType }: { pageType: PageType }) => (
    <div data-testid="entity-library">{pageType}</div>
  ),
}));

import Page, { generateMetadata } from "./page";

describe("spells list Page (public list-page pattern)", () => {
  it("titles the page from the spells.page catalogue", async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe("title");
  });

  it("fetches the item count for the given search params and renders ListPage + EntityLibrary for Spell", async () => {
    getSpellsCount.mockResolvedValue({
      filtered: 3,
      total: 10,
      filteredPages: 1,
    });
    const searchParams = Promise.resolve({ query: "fireball" });

    render(await Page({ searchParams }));

    expect(getSpellsCount).toHaveBeenCalledWith({ query: "fireball" });
    expect(screen.getByTestId("list-page")).toHaveAttribute(
      "data-count",
      "3/10"
    );
    expect(screen.getByTestId("entity-library")).toHaveTextContent(
      PageType.Spell
    );
  });

  it("falls back to an empty search when searchParams is undefined", async () => {
    getSpellsCount.mockResolvedValue({
      filtered: 0,
      total: 0,
      filteredPages: 0,
    });

    render(await Page({}));

    expect(getSpellsCount).toHaveBeenCalledWith({});
  });
});

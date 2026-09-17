import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

vi.mock("@/app/ui/search", () => ({
  default: ({ placeholder }: { placeholder: string }) => (
    <input aria-label="search-input" placeholder={placeholder} />
  ),
}));

const searchAllDomains = vi.fn<(term: string, system: string) => unknown>();
vi.mock("@/app/lib/data/search/searchAllDomains", () => ({
  default: (term: string, system: string) => searchAllDomains(term, system),
}));

const params = Promise.resolve({ system: "dnd5e" });

vi.mock("@/app/ui/search/CrossEntitySearchResults", () => ({
  default: ({ term }: { term: string }) => (
    <div data-testid="results" data-term={term} />
  ),
}));

import SearchPage, { generateMetadata } from "./page";

describe("dashboard search Page (SPEC-011 T2)", () => {
  it("titles the page from the search.page catalogue", async () => {
    const metadata = await generateMetadata();

    expect(metadata.title).toBe("title");
  });

  it("passes an empty term to searchAllDomains and the results component when no query param is present", async () => {
    searchAllDomains.mockResolvedValue({});

    render(await SearchPage({ params, searchParams: Promise.resolve({}) }));

    expect(searchAllDomains).toHaveBeenCalledWith("", "dnd5e");
    expect(screen.getByTestId("results")).toHaveAttribute("data-term", "");
  });

  it("passes the ?query= term through to searchAllDomains and the results component", async () => {
    searchAllDomains.mockResolvedValue({});

    render(
      await SearchPage({
        params,
        searchParams: Promise.resolve({ query: "Fireball" }),
      })
    );

    expect(searchAllDomains).toHaveBeenCalledWith("Fireball", "dnd5e");
    expect(screen.getByTestId("results")).toHaveAttribute(
      "data-term",
      "Fireball"
    );
  });

  it("renders the search input with the catalogue's placeholder", async () => {
    searchAllDomains.mockResolvedValue({});

    render(await SearchPage({ params, searchParams: Promise.resolve({}) }));

    expect(screen.getByLabelText("search-input")).toHaveAttribute(
      "placeholder",
      "searchPlaceholder"
    );
  });

  it("narrows the search to the route's game system (ADR-0013 rule 10)", async () => {
    searchAllDomains.mockResolvedValue({});

    await SearchPage({
      params: Promise.resolve({ system: "daggerheart" }),
      searchParams: Promise.resolve({ query: "Fire" }),
    });

    expect(searchAllDomains).toHaveBeenCalledWith("Fire", "daggerheart");
  });
});

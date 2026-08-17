import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

import CrossEntitySearchResults from "./CrossEntitySearchResults";
import type { SearchAllDomainsResult } from "@/app/lib/data/search/searchAllDomains";

const emptyGroup = { total: 0, items: [] };

function makeResults(
  overrides: Partial<SearchAllDomainsResult>
): SearchAllDomainsResult {
  return {
    spells: emptyGroup,
    magicItems: emptyGroup,
    npc: emptyGroup,
    deities: emptyGroup,
    factions: emptyGroup,
    places: emptyGroup,
    ...overrides,
  };
}

describe("CrossEntitySearchResults (SPEC-011 T2)", () => {
  it("shows the empty-query prompt state when the term is blank", () => {
    render(<CrossEntitySearchResults term="" results={makeResults({})} />);

    expect(screen.getByText("prompt")).toBeInTheDocument();
  });

  it("shows a single no-matches message rather than six empty groups", () => {
    render(
      <CrossEntitySearchResults term="nonexistent" results={makeResults({})} />
    );

    expect(screen.getByText(/noMatches/)).toBeInTheDocument();
    expect(screen.queryByRole("list")).not.toBeInTheDocument();
  });

  it("renders exactly one group when only one domain matches", () => {
    render(
      <CrossEntitySearchResults
        term="Fireball"
        results={makeResults({
          spells: { total: 1, items: [{ id: 1, name: "Fireball" }] },
        })}
      />
    );

    expect(screen.getAllByRole("list")).toHaveLength(1);
    expect(screen.getByText("Fireball")).toBeInTheDocument();
  });

  it("renders both groups when two domains match the same name", () => {
    render(
      <CrossEntitySearchResults
        term="Skreebars"
        results={makeResults({
          npc: { total: 1, items: [{ id: 1, name: "Skreebars" }] },
          deities: { total: 1, items: [{ id: 2, name: "Skreebars" }] },
        })}
      />
    );

    expect(screen.getAllByRole("list")).toHaveLength(2);
    expect(screen.getAllByText("Skreebars")).toHaveLength(2);
  });

  it("renders all six groups when every domain matches", () => {
    const one = (id: number) => ({ total: 1, items: [{ id, name: "X" }] });
    render(
      <CrossEntitySearchResults
        term="X"
        results={{
          spells: one(1),
          magicItems: one(2),
          npc: one(3),
          deities: one(4),
          factions: one(5),
          places: one(6),
        }}
      />
    );

    expect(screen.getAllByRole("list")).toHaveLength(6);
  });

  it("shows a see-all link only when a domain exceeds the cap, pointing at that domain's list page and the term", () => {
    const items = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: `Spell ${i + 1}`,
    }));
    render(
      <CrossEntitySearchResults
        term="Spell"
        results={makeResults({ spells: { total: 8, items } })}
      />
    );

    const seeAll = screen.getByText(/seeAll/);
    expect(seeAll.closest("a")).toHaveAttribute(
      "href",
      "/dashboard/spells?query=Spell"
    );
  });

  it("shows no see-all link when a domain's matches fit within the cap", () => {
    render(
      <CrossEntitySearchResults
        term="Fireball"
        results={makeResults({
          spells: { total: 1, items: [{ id: 1, name: "Fireball" }] },
        })}
      />
    );

    expect(screen.queryByText(/seeAll/)).not.toBeInTheDocument();
  });

  it("links a non-place result to its list page filtered by name", () => {
    render(
      <CrossEntitySearchResults
        term="Fireball"
        results={makeResults({
          spells: { total: 1, items: [{ id: 1, name: "Fireball" }] },
        })}
      />
    );

    expect(screen.getByText("Fireball").closest("a")).toHaveAttribute(
      "href",
      "/dashboard/spells?query=Fireball"
    );
  });

  it("links a place result to the geography page with a place id", () => {
    render(
      <CrossEntitySearchResults
        term="Aerivel"
        results={makeResults({
          places: { total: 1, items: [{ id: 42, name: "Aerivel" }] },
        })}
      />
    );

    expect(screen.getByText("Aerivel").closest("a")).toHaveAttribute(
      "href",
      "/dashboard/geography?place=42"
    );
  });

  it("never shows a see-all link for the places group even over the cap", () => {
    const items = Array.from({ length: 5 }, (_, i) => ({
      id: i + 1,
      name: `Place ${i + 1}`,
    }));
    render(
      <CrossEntitySearchResults
        term="Place"
        results={makeResults({ places: { total: 8, items } })}
      />
    );

    expect(screen.queryByText(/seeAll/)).not.toBeInTheDocument();
  });
});

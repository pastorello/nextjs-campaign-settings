import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key}:${JSON.stringify(values)}` : key,
}));

vi.mock("@/app/lib/hooks/useGameSystem", () => ({ default: () => "dnd5e" }));

vi.mock("@/i18n/navigation", () => ({
  Link: ({
    href,
    children,
    ...rest
  }: {
    href: string;
    children: React.ReactNode;
  }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
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
    dhDomains: emptyGroup,
    dhDomainCards: emptyGroup,
    dhClasses: emptyGroup,
    dhSubclasses: emptyGroup,
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
        results={makeResults({
          spells: one(1),
          magicItems: one(2),
          npc: one(3),
          deities: one(4),
          factions: one(5),
          places: one(6),
        })}
      />
    );

    expect(screen.getAllByRole("list")).toHaveLength(6);
  });

  it("renders the Daggerheart groups after the world's, each result opening its record (SPEC-021 T7)", () => {
    const one = (id: number, name: string) => ({
      total: 1,
      items: [{ id, name }],
    });
    render(
      <CrossEntitySearchResults
        term="Lan"
        results={makeResults({
          places: one(6, "Lantern Hill"),
          dhDomains: one(3, "Lanternfall"),
          dhDomainCards: one(31, "Lantern Step"),
          dhClasses: one(7, "Lamplighter"),
          dhSubclasses: one(11, "Lantern Warden"),
        })}
      />
    );

    expect(
      screen.getAllByRole("heading", { level: 2 }).map((h) => h.textContent)
    ).toEqual([
      "places (1)",
      "dhDomains (1)",
      "dhDomainCards (1)",
      "dhClasses (1)",
      "dhSubclasses (1)",
    ]);
    expect(screen.getByRole("link", { name: "Lanternfall" })).toHaveAttribute(
      "href",
      "/dashboard/dnd5e/domains/3"
    );
    expect(screen.getByRole("link", { name: "Lantern Step" })).toHaveAttribute(
      "href",
      "/dashboard/dnd5e/domain-cards?query=Lantern%20Step"
    );
    expect(screen.getByRole("link", { name: "Lamplighter" })).toHaveAttribute(
      "href",
      "/dashboard/dnd5e/classes/7"
    );
    expect(
      screen.getByRole("link", { name: "Lantern Warden" })
    ).toHaveAttribute("href", "/dashboard/dnd5e/subclasses/11");
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
      "/dashboard/dnd5e/spells?query=Spell"
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
      "/dashboard/dnd5e/spells?query=Fireball"
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
      "/dashboard/dnd5e/geography?place=42"
    );
  });

  // TD-135: the group heading's count re-renders on every keystroke, with no
  // aria-live ancestor to announce it — a screen reader user typing a search
  // term never heard the result count change.
  it("puts each group's count in a role=status element", () => {
    render(
      <CrossEntitySearchResults
        term="Fireball"
        results={makeResults({
          spells: { total: 6, items: [{ id: 1, name: "Fireball" }] },
        })}
      />
    );

    expect(screen.getByRole("status")).toHaveTextContent("6");
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

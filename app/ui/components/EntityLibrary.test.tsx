import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";

// The four *Library components own their own filter controls and card
// rendering, each with its own suite. EntityLibrary's job is only to fetch
// the right domain's rows and hand them to the right library — stubbing the
// libraries keeps this suite about that dispatch, not their internals.
// The record-link resolver is an async Server Component (it reads the
// database); RTL renders client trees, so it is a pass-through here that
// records what it was asked to resolve (SPEC-019 T5).
const { resolvedValues } = vi.hoisted(() => ({
  resolvedValues: vi.fn(),
}));
vi.mock("../richText/ResolvedRecordLinks", () => ({
  default: ({
    values,
    system,
    children,
  }: {
    values: unknown;
    system: string;
    children: React.ReactNode;
  }) => {
    resolvedValues(values, system);
    return children;
  },
}));

vi.mock("../deities/DeityLibrary", () => ({
  default: ({ items }: { items: unknown[] }) => (
    <div>DeityLibrary:{items.length}</div>
  ),
}));
vi.mock("../magicitems/MagicItemLibrary", () => ({
  default: ({ items }: { items: unknown[] }) => (
    <div>MagicItemLibrary:{items.length}</div>
  ),
}));
vi.mock("../npc/NpcLibrary", () => ({
  default: ({
    items,
    placements,
  }: {
    items: unknown[];
    placements: Record<number, { place: string | null }>;
  }) => (
    <div>
      NpcLibrary:{items.length}
      <span>placed:{Object.keys(placements).length}</span>
    </div>
  ),
}));
vi.mock("../spells/SpellLibrary", () => ({
  default: ({ items }: { items: unknown[] }) => (
    <div>SpellLibrary:{items.length}</div>
  ),
}));
// FactionLibrary renders FactionCard, which (since SPEC-018 T2 part B) reaches
// next-intl's `Link` from `@/i18n/navigation` — real next-intl navigation
// cannot be imported in this test environment (see other suites that mock
// this same module), so FactionLibrary is stubbed like its four siblings
// above even though no case here exercises PageType.Faction yet.
vi.mock("../factions/FactionLibrary", () => ({
  default: ({ items }: { items: unknown[] }) => (
    <div>FactionLibrary:{items.length}</div>
  ),
}));

// SPEC-021's Daggerheart libraries reach the same next-intl navigation (the
// domain list links each domain's page), so they are stubbed too.
vi.mock("../dhDomains/DhDomainLibrary", () => ({
  default: ({ items }: { items: unknown[] }) => (
    <div>DhDomainLibrary:{items.length}</div>
  ),
}));
vi.mock("../dhDomainCards/DhDomainCardLibrary", () => ({
  default: ({ items }: { items: unknown[] }) => (
    <div>DhDomainCardLibrary:{items.length}</div>
  ),
}));

const fetchFilteredSpells = vi.fn<(...args: unknown[]) => unknown>();
const fetchFilteredNpc = vi.fn<(...args: unknown[]) => unknown>();
const fetchFilteredDeities = vi.fn<(...args: unknown[]) => unknown>();
const fetchFilteredMagicItems = vi.fn<(...args: unknown[]) => unknown>();
const fetchFilteredDhDomains = vi.fn<(...args: unknown[]) => unknown>();
const fetchFilteredDhDomainCards = vi.fn<(...args: unknown[]) => unknown>();

vi.mock("@/app/lib/data/spells/fetchFilteredSpells", () => ({
  fetchFilteredSpells: (...args: unknown[]) => fetchFilteredSpells(...args),
}));
vi.mock("@/app/lib/data/npc/fetchFilteredNpc", () => ({
  fetchFilteredNpc: (...args: unknown[]) => fetchFilteredNpc(...args),
}));
vi.mock("@/app/lib/data/deities/fetchFilteredDeities", () => ({
  fetchFilteredDeities: (...args: unknown[]) => fetchFilteredDeities(...args),
}));
vi.mock("@/app/lib/data/magicitems/fetchFilteredMagicItems", () => ({
  fetchFilteredMagicItems: (...args: unknown[]) =>
    fetchFilteredMagicItems(...args),
}));
vi.mock("@/app/lib/data/dhDomains/fetchFilteredDhDomains", () => ({
  fetchFilteredDhDomains: (...args: unknown[]) =>
    fetchFilteredDhDomains(...args),
}));
vi.mock("@/app/lib/data/dhDomainCards/fetchFilteredDhDomainCards", () => ({
  fetchFilteredDhDomainCards: (...args: unknown[]) =>
    fetchFilteredDhDomainCards(...args),
}));

// Npc and Deity resolve each record's place in the world tree (SPEC-004
// T5a). Mocked both to keep this suite about dispatch and because the real
// module reaches prisma, which needs a DATABASE_URL this suite has no
// business requiring.
const fetchDerivedAncestry = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/maps/fetchDerivedAncestry", () => ({
  default: (...args: unknown[]) => fetchDerivedAncestry(...args),
}));

// The NPC library's faction option bundle (SPEC-006 T7) — same reasoning as
// fetchDerivedAncestry above.
const fetchFieldOptions = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/options/fetchFieldOptions", () => ({
  default: (...args: unknown[]) => fetchFieldOptions(...args),
}));

import EntityLibrary from "./EntityLibrary";

describe("EntityLibrary", () => {
  beforeEach(() => {
    fetchDerivedAncestry.mockResolvedValue(new Map());
    fetchFieldOptions.mockResolvedValue([]);
  });

  it("fetches spells and renders SpellLibrary for PageType.Spell", async () => {
    fetchFilteredSpells.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    render(await EntityLibrary({ system: "dnd5e", pageType: PageType.Spell }));

    expect(fetchFilteredSpells).toHaveBeenCalled();
    expect(screen.getByText("SpellLibrary:2")).toBeInTheDocument();
  });

  it("fetches NPCs and renders NpcLibrary for PageType.Npc", async () => {
    fetchFilteredNpc.mockResolvedValue([{ id: 1 }]);

    render(await EntityLibrary({ system: "dnd5e", pageType: PageType.Npc }));

    expect(fetchFilteredNpc).toHaveBeenCalled();
    expect(screen.getByText("NpcLibrary:1")).toBeInTheDocument();
  });

  it("hands NpcLibrary each record's derived placement, not just the rows", async () => {
    fetchFilteredNpc.mockResolvedValue([{ id: 42 }]);
    fetchDerivedAncestry.mockResolvedValue(
      new Map([[42, [{ id: 1, title: "Skreebars", kind: "city" }]]])
    );

    render(await EntityLibrary({ system: "dnd5e", pageType: PageType.Npc }));

    expect(fetchDerivedAncestry).toHaveBeenCalledWith("npc");
    expect(screen.getByText("placed:1")).toBeInTheDocument();
  });

  it("fetches deities and renders DeityLibrary for PageType.Deity", async () => {
    fetchFilteredDeities.mockResolvedValue([]);

    render(await EntityLibrary({ system: "dnd5e", pageType: PageType.Deity }));

    expect(fetchFilteredDeities).toHaveBeenCalled();
    expect(screen.getByText("DeityLibrary:0")).toBeInTheDocument();
  });

  it("fetches magic items and renders MagicItemLibrary for PageType.MagicItem", async () => {
    fetchFilteredMagicItems.mockResolvedValue([
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ]);

    render(
      await EntityLibrary({ system: "dnd5e", pageType: PageType.MagicItem })
    );

    expect(fetchFilteredMagicItems).toHaveBeenCalled();
    expect(screen.getByText("MagicItemLibrary:3")).toBeInTheDocument();
  });

  it("fetches domains and renders DhDomainLibrary for PageType.DhDomain (SPEC-021 T2)", async () => {
    fetchFilteredDhDomains.mockResolvedValue([{ id: 1 }]);

    render(
      await EntityLibrary({
        system: "daggerheart",
        pageType: PageType.DhDomain,
      })
    );

    expect(screen.getByText("DhDomainLibrary:1")).toBeInTheDocument();
  });

  it("fetches cards and renders DhDomainCardLibrary for PageType.DhDomainCard (SPEC-021 T3)", async () => {
    fetchFilteredDhDomainCards.mockResolvedValue([
      { id: 1, featureText: "<p>Glow</p>" },
      { id: 2, featureText: "<p>Dim</p>" },
    ]);

    render(
      await EntityLibrary({
        system: "daggerheart",
        pageType: PageType.DhDomainCard,
      })
    );

    expect(screen.getByText("DhDomainCardLibrary:2")).toBeInTheDocument();
    expect(resolvedValues).toHaveBeenCalledWith(
      ["<p>Glow</p>", "<p>Dim</p>"],
      "daggerheart"
    );
  });

  it("passes the search params through to the fetch call", async () => {
    fetchFilteredSpells.mockResolvedValue([]);
    const searchParams = Promise.resolve({ query: "fire" });

    await EntityLibrary({
      system: "dnd5e",
      pageType: PageType.Spell,
      searchParams,
    });

    expect(fetchFilteredSpells).toHaveBeenCalledWith(searchParams);
  });

  it("defaults to an empty search params object when none is given", async () => {
    fetchFilteredSpells.mockResolvedValue([]);

    await EntityLibrary({ system: "dnd5e", pageType: PageType.Spell });

    expect(fetchFilteredSpells).toHaveBeenCalledWith({});
  });

  it("resolves the record links of the rows' formatted text under the route system (SPEC-019 T5)", async () => {
    fetchFilteredSpells.mockResolvedValue([
      { id: 1, description: "<p>Boom</p>", upcast: null },
    ]);

    render(await EntityLibrary({ system: "dnd5e", pageType: PageType.Spell }));

    expect(resolvedValues).toHaveBeenCalledWith(["<p>Boom</p>", null], "dnd5e");
  });
});

import { render, screen } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";

// The four *Library components own their own filter controls and card
// rendering, each with its own suite. EntityLibrary's job is only to fetch
// the right domain's rows and hand them to the right library — stubbing the
// libraries keeps this suite about that dispatch, not their internals.
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

const fetchFilteredSpells = vi.fn<(...args: unknown[]) => unknown>();
const fetchFilteredNpc = vi.fn<(...args: unknown[]) => unknown>();
const fetchFilteredDeities = vi.fn<(...args: unknown[]) => unknown>();
const fetchFilteredMagicItems = vi.fn<(...args: unknown[]) => unknown>();

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

// Npc and Deity resolve each record's place in the world tree (SPEC-004
// T5a). Mocked both to keep this suite about dispatch and because the real
// module reaches prisma, which needs a DATABASE_URL this suite has no
// business requiring.
const fetchDerivedAncestry = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/maps/fetchDerivedAncestry", () => ({
  default: (...args: unknown[]) => fetchDerivedAncestry(...args),
}));

import EntityLibrary from "./EntityLibrary";

describe("EntityLibrary", () => {
  beforeEach(() => {
    fetchDerivedAncestry.mockResolvedValue(new Map());
  });

  it("fetches spells and renders SpellLibrary for PageType.Spell", async () => {
    fetchFilteredSpells.mockResolvedValue([{ id: 1 }, { id: 2 }]);

    render(await EntityLibrary({ pageType: PageType.Spell }));

    expect(fetchFilteredSpells).toHaveBeenCalled();
    expect(screen.getByText("SpellLibrary:2")).toBeInTheDocument();
  });

  it("fetches NPCs and renders NpcLibrary for PageType.Npc", async () => {
    fetchFilteredNpc.mockResolvedValue([{ id: 1 }]);

    render(await EntityLibrary({ pageType: PageType.Npc }));

    expect(fetchFilteredNpc).toHaveBeenCalled();
    expect(screen.getByText("NpcLibrary:1")).toBeInTheDocument();
  });

  it("hands NpcLibrary each record's derived placement, not just the rows", async () => {
    fetchFilteredNpc.mockResolvedValue([{ id: 42 }]);
    fetchDerivedAncestry.mockResolvedValue(
      new Map([[42, [{ id: 1, title: "Skreebars", kind: "city" }]]])
    );

    render(await EntityLibrary({ pageType: PageType.Npc }));

    expect(fetchDerivedAncestry).toHaveBeenCalledWith("npc");
    expect(screen.getByText("placed:1")).toBeInTheDocument();
  });

  it("fetches deities and renders DeityLibrary for PageType.Deity", async () => {
    fetchFilteredDeities.mockResolvedValue([]);

    render(await EntityLibrary({ pageType: PageType.Deity }));

    expect(fetchFilteredDeities).toHaveBeenCalled();
    expect(screen.getByText("DeityLibrary:0")).toBeInTheDocument();
  });

  it("fetches magic items and renders MagicItemLibrary for PageType.MagicItem", async () => {
    fetchFilteredMagicItems.mockResolvedValue([
      { id: 1 },
      { id: 2 },
      { id: 3 },
    ]);

    render(await EntityLibrary({ pageType: PageType.MagicItem }));

    expect(fetchFilteredMagicItems).toHaveBeenCalled();
    expect(screen.getByText("MagicItemLibrary:3")).toBeInTheDocument();
  });

  it("passes the search params through to the fetch call", async () => {
    fetchFilteredSpells.mockResolvedValue([]);
    const searchParams = Promise.resolve({ query: "fire" });

    await EntityLibrary({ pageType: PageType.Spell, searchParams });

    expect(fetchFilteredSpells).toHaveBeenCalledWith(searchParams);
  });

  it("defaults to an empty search params object when none is given", async () => {
    fetchFilteredSpells.mockResolvedValue([]);

    await EntityLibrary({ pageType: PageType.Spell });

    expect(fetchFilteredSpells).toHaveBeenCalledWith({});
  });
});

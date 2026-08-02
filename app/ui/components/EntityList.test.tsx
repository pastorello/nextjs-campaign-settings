import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";

vi.mock("next-intl/server", () => ({
  getTranslations: () => Promise.resolve((key: string) => key),
}));

// The row-level buttons pull in next/navigation, next-intl and the full
// domain form stack (ModalButton -> *Form -> EntityForm). None of that is
// EntityList's own responsibility — it is covered by SortableHeader's,
// DeleteButton's and ModalButton's own suites — so they are stubbed to keep
// this suite about EntityList's own branches: dispatch, empty state, the
// name/subtitle cell, and the column list from listConfig.
vi.mock("../buttons/SortableHeader", () => ({
  default: ({ label }: { label: string }) => <span>{label}</span>,
}));
vi.mock("../buttons/DeleteButton", () => ({
  default: ({ pageName }: { pageName: string }) => (
    <button>delete-{pageName}</button>
  ),
}));
vi.mock("../buttons/ModalButton", () => ({
  default: ({ buttonLabel }: { buttonLabel: string }) => (
    <button>{buttonLabel}</button>
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

import EntityList from "./EntityList";

describe("EntityList", () => {
  it("dispatches to the fetch function matching its own pageType only", async () => {
    fetchFilteredSpells.mockResolvedValue([]);
    fetchFilteredNpc.mockResolvedValue([]);
    fetchFilteredDeities.mockResolvedValue([]);
    fetchFilteredMagicItems.mockResolvedValue([]);

    render(await EntityList({ pageType: PageType.Deity }));

    expect(fetchFilteredDeities).toHaveBeenCalled();
    expect(fetchFilteredSpells).not.toHaveBeenCalled();
    expect(fetchFilteredNpc).not.toHaveBeenCalled();
    expect(fetchFilteredMagicItems).not.toHaveBeenCalled();
  });

  it("shows the domain's empty message when there are no rows", async () => {
    fetchFilteredNpc.mockResolvedValue([]);

    render(await EntityList({ pageType: PageType.Npc }));

    expect(screen.getByText("npc.page.emptyMessage")).toBeInTheDocument();
  });

  it("renders one row per item, with the subtitle field under the name", async () => {
    fetchFilteredNpc.mockResolvedValue([
      {
        id: 1,
        name: "Elminster",
        title: "The Sage of Shadowdale",
        alignment: 1,
        alignmentDomain: 1,
        faction: 1,
        location: 1,
      },
    ]);

    render(await EntityList({ pageType: PageType.Npc }));

    expect(screen.queryByText("npc.page.emptyMessage")).not.toBeInTheDocument();
    expect(screen.getByText("Elminster")).toBeInTheDocument();
    expect(screen.getByText("The Sage of Shadowdale")).toBeInTheDocument();
  });

  it("does not render a subtitle line for a domain with no subtitleField", async () => {
    fetchFilteredDeities.mockResolvedValue([
      {
        id: 1,
        name: "Bahamut",
        alignment: 1,
        alignmentDomain: 1,
        deityRank: 1,
        deityType: 1,
        residence: 1,
      },
    ]);

    render(await EntityList({ pageType: PageType.Deity }));

    expect(screen.getByText("Bahamut")).toBeInTheDocument();
    // A subtitle would be a second <br />-separated text node under the same
    // <p> — deities' listConfig declares no subtitleField, so there is none.
    expect(screen.getByText("Bahamut").closest("p")?.textContent).toBe(
      "Bahamut"
    );
  });

  it("renders a header for every column listConfig declares for the domain", async () => {
    fetchFilteredMagicItems.mockResolvedValue([]);

    render(await EntityList({ pageType: PageType.MagicItem }));

    expect(
      screen.getByText("magicItems.fields.rarity.label")
    ).toBeInTheDocument();
    expect(
      screen.getByText("magicItems.fields.type.label")
    ).toBeInTheDocument();
    expect(
      screen.getByText("magicItems.fields.attuned.shortLabel")
    ).toBeInTheDocument();
  });

  it("renders the edit and delete actions for each row", async () => {
    fetchFilteredSpells.mockResolvedValue([
      {
        id: 1,
        name: "Fireball",
        level: 3,
        circle: [],
        classes: [],
        castingTime: "1Azione",
        range: "60",
        components: "V,S,M",
        duration: "Istantanea",
        savingThrow: "Destrezza",
        ritual: false,
        concentration: false,
        upcast: "",
      },
    ]);

    render(await EntityList({ pageType: PageType.Spell }));

    expect(screen.getByText("common.table.edit")).toBeInTheDocument();
    expect(screen.getByText("delete-Fireball")).toBeInTheDocument();
  });
});

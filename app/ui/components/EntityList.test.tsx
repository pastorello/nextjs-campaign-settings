import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PageType from "@/app/lib/definitions/types/PageType";
import type OptionBundle from "@/app/lib/definitions/types/OptionBundle";

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

vi.mock("next-intl/server", () => ({
  getTranslations: () =>
    Promise.resolve((key: string, values?: Record<string, unknown>) =>
      values ? `${key}:${JSON.stringify(values)}` : key
    ),
}));

// The row-level buttons pull in next/navigation, next-intl and the full
// domain form stack (ModalButton -> *Form -> EntityForm). None of that is
// EntityList's own responsibility — it is covered by SortableHeader's,
// DeleteButton's and ModalButton's own suites — so they are stubbed to keep
// this suite about EntityList's own branches: dispatch, empty state, the
// name/subtitle cell, and the column list from listConfig. The header stub
// echoes the two props EntityList itself decides — whether the column filters,
// and the option bundle it filters from — so that wiring stays covered here.
vi.mock("../buttons/SortableHeader", () => ({
  default: ({
    label,
    isFiltrable,
    optionBundle,
  }: {
    label: string;
    isFiltrable?: boolean;
    optionBundle?: OptionBundle | undefined;
  }) => (
    <span
      data-filtrable={String(isFiltrable)}
      data-bundle={JSON.stringify(optionBundle ?? null)}
    >
      {label}
    </span>
  ),
}));
vi.mock("../buttons/DeleteButton", () => ({
  default: ({ pageName }: { pageName: string }) => (
    <button>delete-{pageName}</button>
  ),
}));
vi.mock("../buttons/ModalButton", () => ({
  default: ({
    buttonLabel,
    ariaLabel,
  }: {
    buttonLabel: string;
    ariaLabel?: string;
  }) => <button aria-label={ariaLabel}>{buttonLabel}</button>,
}));
vi.mock("../buttons/AssignLocationButton", () => ({
  default: ({ currentLocationLabel }: { currentLocationLabel: string }) => (
    <button>assign-location:{currentLocationLabel}</button>
  ),
}));
vi.mock("./LocationFilterControl", () => ({
  default: () => <div data-testid="location-filter-control" />,
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
const fetchFilteredFactions = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/faction/fetchFilteredFactions", () => ({
  fetchFilteredFactions: (...args: unknown[]) => fetchFilteredFactions(...args),
}));

const fetchFilteredDhClasses = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/dhClasses/fetchFilteredDhClasses", () => ({
  fetchFilteredDhClasses: (...args: unknown[]) =>
    fetchFilteredDhClasses(...args),
}));
const fetchFilteredDhSubclasses = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/dhSubclasses/fetchFilteredDhSubclasses", () => ({
  fetchFilteredDhSubclasses: (...args: unknown[]) =>
    fetchFilteredDhSubclasses(...args),
}));

// Backs both the "Location" column (SPEC-008 T6) and the assignment
// button's "current location" display (T5) — stubbed to an empty map by
// default, overridden by the dedicated tests below. Same fetch and shape
// EntityLibrary reads (TD-77): a Map of each record's ancestor chain,
// reduced through the real (unmocked) `toDerivedPlacements`.
const fetchDerivedAncestry = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/maps/fetchDerivedAncestry", () => ({
  default: (...args: unknown[]) => fetchDerivedAncestry(...args),
}));

// The NPC "Fazione" column's option bundle (SPEC-006 T7) — stubbed empty by
// default; none of this suite's assertions read a resolved faction label.
const fetchFieldOptions = vi.fn<(...args: unknown[]) => unknown>();
vi.mock("@/app/lib/data/options/fetchFieldOptions", () => ({
  default: (...args: unknown[]) => fetchFieldOptions(...args),
}));

import EntityList from "./EntityList";

describe("EntityList", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    fetchDerivedAncestry.mockResolvedValue(new Map());
    fetchFieldOptions.mockResolvedValue([]);
  });

  it("dispatches to the fetch function matching its own pageType only", async () => {
    fetchFilteredSpells.mockResolvedValue([]);
    fetchFilteredNpc.mockResolvedValue([]);
    fetchFilteredDeities.mockResolvedValue([]);
    fetchFilteredMagicItems.mockResolvedValue([]);

    render(await EntityList({ system: "dnd5e", pageType: PageType.Deity }));

    expect(fetchFilteredDeities).toHaveBeenCalled();
    expect(fetchFilteredSpells).not.toHaveBeenCalled();
    expect(fetchFilteredNpc).not.toHaveBeenCalled();
    expect(fetchFilteredMagicItems).not.toHaveBeenCalled();
  });

  it("shows the domain's empty message when there are no rows", async () => {
    fetchFilteredNpc.mockResolvedValue([]);

    render(await EntityList({ system: "dnd5e", pageType: PageType.Npc }));

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

    render(await EntityList({ system: "dnd5e", pageType: PageType.Npc }));

    expect(screen.queryByText("npc.page.emptyMessage")).not.toBeInTheDocument();
    // Scoped to the table: the phone-viewport list (TD-113) renders the same
    // name and subtitle in its own row, so an unscoped query would match twice.
    const table = within(screen.getByTestId("entity-list-table"));
    expect(table.getByText("Elminster")).toBeInTheDocument();
    expect(table.getByText("The Sage of Shadowdale")).toBeInTheDocument();
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

    render(await EntityList({ system: "dnd5e", pageType: PageType.Deity }));

    const table = within(screen.getByTestId("entity-list-table"));
    expect(table.getByText("Bahamut")).toBeInTheDocument();
    // A subtitle would be a second <br />-separated text node in the name
    // cell — deities' listConfig declares no subtitleField, so there is none.
    expect(table.getByText("Bahamut").closest("td")?.textContent).toBe(
      "Bahamut"
    );
  });

  it("shows an NPC's assigned location in the Location column", async () => {
    fetchFilteredNpc.mockResolvedValue([
      {
        id: 42,
        name: "Dexter Nemrod",
        title: "",
        alignment: 1,
        alignmentDomain: 1,
        faction: 1,
      },
    ]);
    fetchDerivedAncestry.mockResolvedValue(
      new Map([[42, [{ id: 1, title: "Skreebars", kind: "city" }]]])
    );

    render(await EntityList({ system: "dnd5e", pageType: PageType.Npc }));

    expect(fetchDerivedAncestry).toHaveBeenCalledWith("npc");
    expect(screen.getByText("Skreebars")).toBeInTheDocument();
  });

  it("shows Sconosciuta in the Location column for a record with nothing assigned", async () => {
    fetchFilteredDeities.mockResolvedValue([
      {
        id: 7,
        name: "Helios",
        alignment: 1,
        alignmentDomain: 1,
        deityRank: 1,
        deityType: 1,
      },
    ]);
    fetchDerivedAncestry.mockResolvedValue(new Map());

    render(await EntityList({ system: "dnd5e", pageType: PageType.Deity }));

    expect(fetchDerivedAncestry).toHaveBeenCalledWith("deity");
    expect(screen.getByText("common.location.unknown")).toBeInTheDocument();
  });

  it("renders the Zone/POI filter control for Npc/Deity page types only", async () => {
    fetchFilteredNpc.mockResolvedValue([]);

    render(await EntityList({ system: "dnd5e", pageType: PageType.Npc }));

    expect(screen.getByTestId("location-filter-control")).toBeInTheDocument();
  });

  it("renders a header for every column listConfig declares for the domain", async () => {
    fetchFilteredMagicItems.mockResolvedValue([]);

    render(await EntityList({ system: "dnd5e", pageType: PageType.MagicItem }));

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

  // Regression test for TD-78: the Fazione column was sort-only from SPEC-006
  // T7 on, because its header never received the bundle the edit form did.
  it("gives the NPC list's Fazione header a filter fed by the option bundle", async () => {
    fetchFilteredNpc.mockResolvedValue([]);
    fetchFieldOptions.mockResolvedValue([
      { value: 3, label: "Gilda dei Ladri" },
    ]);

    render(await EntityList({ system: "dnd5e", pageType: PageType.Npc }));

    const header = screen.getByText("npc.fields.faction.label");
    expect(header).toHaveAttribute("data-filtrable", "true");
    expect(JSON.parse(header.getAttribute("data-bundle") ?? "null")).toEqual({
      faction: [{ value: 3, label: "Gilda dei Ladri" }],
    });
  });

  // SPEC-021 T5: the class filter is the class column's header filter, fed
  // from the option table the metadata names — no per-page wiring.
  it("gives the subclass list's class header a filter fed by the class options", async () => {
    fetchFilteredDhSubclasses.mockResolvedValue([]);
    fetchFieldOptions.mockResolvedValue([
      { value: 4, label: "Lantern Warden" },
    ]);

    render(
      await EntityList({ system: "daggerheart", pageType: PageType.DhSubclass })
    );

    expect(fetchFieldOptions).toHaveBeenCalledTimes(1);
    expect(fetchFieldOptions).toHaveBeenCalledWith("dhClass");
    const header = screen.getByText("dhSubclasses.fields.classId.label");
    expect(header).toHaveAttribute("data-filtrable", "true");
    expect(JSON.parse(header.getAttribute("data-bundle") ?? "null")).toEqual({
      dhClass: [{ value: 4, label: "Lantern Warden" }],
    });
  });

  // SPEC-021 T4: both domain columns read one table, resolved once; the
  // features' formatted text resolves its record links with the fields'.
  it("resolves the class list's domains once and its features' links", async () => {
    fetchFilteredDhClasses.mockResolvedValue([
      {
        id: 4,
        name: "Lantern Warden",
        description: "<p>d</p>",
        domainAId: 1,
        domainBId: 2,
        startingEvasion: 9,
        startingHp: 6,
        classItems: "",
        hopeFeatureName: "Kindle",
        hopeFeatureText: "<p>h</p>",
        origin: "homebrew",
        features: [
          { id: 1, classId: 4, position: 1, name: "A", text: "<p>f</p>" },
        ],
      },
    ]);

    render(
      await EntityList({ system: "daggerheart", pageType: PageType.DhClass })
    );

    expect(fetchFieldOptions).toHaveBeenCalledTimes(1);
    expect(fetchFieldOptions).toHaveBeenCalledWith("dhDomain");
    expect(resolvedValues).toHaveBeenCalledWith(
      expect.arrayContaining(["<p>f</p>", "<p>h</p>"]),
      "daggerheart"
    );
  });

  // TD-136: every row's Edit button announced as plain "Modifica" — this
  // gives each one the item's name so a screen reader's button list can
  // tell rows apart.
  it("gives each row's Edit button an aria-label carrying the item's name", async () => {
    fetchFilteredDeities.mockResolvedValue([
      {
        id: 1,
        name: "Bahamut",
        alignment: 1,
        alignmentDomain: 1,
        deityRank: 1,
        deityType: 1,
      },
    ]);

    render(await EntityList({ system: "dnd5e", pageType: PageType.Deity }));

    // Both the table row and the phone-viewport row (TD-113) carry the same
    // per-item aria-label, so there are two matches — one edit control per
    // surface, each still named for the item.
    expect(
      screen.getAllByRole("button", {
        name: 'common.table.editItem:{"name":"Bahamut"}',
      })
    ).toHaveLength(2);
  });

  it("renders the assign-location button for an NPC row with its current summary", async () => {
    fetchFilteredNpc.mockResolvedValue([
      {
        id: 42,
        name: "Dexter Nemrod",
        title: "",
        alignment: 1,
        alignmentDomain: 1,
        faction: 1,
        location: 1,
      },
    ]);
    fetchDerivedAncestry.mockResolvedValue(
      new Map([[42, [{ id: 5, title: "Skreebars", kind: "city" }]]])
    );

    render(await EntityList({ system: "dnd5e", pageType: PageType.Npc }));

    expect(screen.getByText("assign-location:Skreebars")).toBeInTheDocument();
  });

  it("does not render the assign-location button for a domain with no location", async () => {
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

    render(await EntityList({ system: "dnd5e", pageType: PageType.Spell }));

    expect(fetchDerivedAncestry).not.toHaveBeenCalled();
    expect(screen.queryByText(/assign-location:/)).not.toBeInTheDocument();
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

    render(await EntityList({ system: "dnd5e", pageType: PageType.Spell }));

    // One instance in the table, one in the phone-viewport row (TD-113).
    expect(screen.getAllByText("common.table.edit")).toHaveLength(2);
    expect(screen.getAllByText("delete-Fireball")).toHaveLength(2);
  });

  // TD-113: below `md` the table is `hidden`, so without this fallback a
  // phone showed nothing but pagination. Built from the same `listConfig`
  // columns as the table rather than a hand-written card.
  describe("the phone-viewport fallback", () => {
    it("shows the name, the domain's first two columns, and edit/delete for each row", async () => {
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

      render(await EntityList({ system: "dnd5e", pageType: PageType.Npc }));

      const mobile = within(screen.getByTestId("entity-list-mobile"));
      expect(mobile.getByText("Elminster")).toBeInTheDocument();
      // Npc's first two listConfig columns are alignment and
      // alignmentDomain — location is its fourth and last, so it is not
      // expected here.
      expect(
        mobile.getByText("npc.fields.alignment.label:")
      ).toBeInTheDocument();
      expect(
        mobile.getByText("npc.fields.alignmentDomain.label:")
      ).toBeInTheDocument();
      expect(mobile.getByText("common.table.edit")).toBeInTheDocument();
      expect(mobile.getByText("delete-Elminster")).toBeInTheDocument();
    });

    // Factions list their description, which renders through
    // renderRichText as a <div>; inside a <p> that is invalid HTML and a
    // hydration error on every admin factions page (seen in CI, 2026-09-18).
    it("never nests a block-level value inside a paragraph", async () => {
      fetchFilteredFactions.mockResolvedValue([
        {
          id: 7,
          name: "Custodi della Fiamma",
          description: "Line one\nLine two",
        },
      ]);

      const { container } = render(
        await EntityList({ system: "dnd5e", pageType: PageType.Faction })
      );

      expect(container.querySelectorAll("p div")).toHaveLength(0);
    });

    it("leaves out AssignLocationButton, unlike the table row", async () => {
      fetchFilteredNpc.mockResolvedValue([
        {
          id: 42,
          name: "Dexter Nemrod",
          title: "",
          alignment: 1,
          alignmentDomain: 1,
          faction: 1,
        },
      ]);
      fetchDerivedAncestry.mockResolvedValue(
        new Map([[42, [{ id: 5, title: "Skreebars", kind: "city" }]]])
      );

      render(await EntityList({ system: "dnd5e", pageType: PageType.Npc }));

      // The table row does render it (covered by the dedicated test above);
      // the mobile row's own scope must not.
      const mobile = within(screen.getByTestId("entity-list-mobile"));
      expect(mobile.queryByText(/assign-location:/)).not.toBeInTheDocument();
    });
  });

  it("resolves the record links of the rows' formatted text under the route system (SPEC-019 T5)", async () => {
    fetchFilteredFactions.mockResolvedValue([
      { id: 1, name: "Guild", description: "<p>Traders</p>" },
    ]);

    render(await EntityList({ system: "dnd5e", pageType: PageType.Faction }));

    expect(resolvedValues).toHaveBeenCalledWith(["<p>Traders</p>"], "dnd5e");
  });
  describe("record images (SPEC-020 T4)", () => {
    const image = {
      displayKey: "display-key.webp",
      thumbKey: "thumb-key.webp",
      width: 800,
      height: 600,
    };

    it("shows a row's thumbnail in both the table and the phone row, named after the record", async () => {
      fetchFilteredNpc.mockResolvedValue([
        { id: 1, name: "Elminster", alignment: 1, faction: 1, image },
      ]);

      render(await EntityList({ system: "dnd5e", pageType: PageType.Npc }));

      for (const scope of ["entity-list-table", "entity-list-mobile"]) {
        const thumb = within(screen.getByTestId(scope)).getByRole("img", {
          name: "Elminster",
        });
        expect(thumb).toHaveAttribute(
          "src",
          "/api/record-images/thumb-key.webp"
        );
        expect(thumb).toHaveAttribute("loading", "lazy");
      }
    });

    it("shows a placeholder for a row with no image", async () => {
      fetchFilteredNpc.mockResolvedValue([
        { id: 1, name: "Elminster", alignment: 1, faction: 1, image: null },
      ]);

      render(await EntityList({ system: "dnd5e", pageType: PageType.Npc }));

      expect(screen.queryByRole("img")).not.toBeInTheDocument();
      expect(
        within(screen.getByTestId("entity-list-table")).getByTestId(
          "record-thumbnail-placeholder"
        )
      ).toBeInTheDocument();
    });

    it("shows neither for a domain without an image field", async () => {
      fetchFilteredSpells.mockResolvedValue([{ id: 1, name: "Fireball" }]);

      render(await EntityList({ system: "dnd5e", pageType: PageType.Spell }));

      expect(
        screen.queryByTestId("record-thumbnail-placeholder")
      ).not.toBeInTheDocument();
    });
  });
});

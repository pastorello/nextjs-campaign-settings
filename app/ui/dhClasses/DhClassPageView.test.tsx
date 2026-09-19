import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DhClassPage from "@/app/lib/definitions/interfaces/daggerheart/DhClassPage";
import DhSubclassFeatureTier from "@/app/lib/definitions/enums/daggerheart/DhSubclassFeatureTier";

// Keys come back with their values, so the assertions see what is resolved.
vi.mock("next-intl", () => ({
  useTranslations:
    () => (key: string, values?: Record<string, string | number>) =>
      values ? `${key}(${Object.values(values).join(",")})` : key,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/app/ui/fonts", () => ({ lusitana: { className: "" } }));

import DhClassPageView from "./DhClassPageView";

// Invented content only (SPEC-018 §5): no SRD names or text.
const veilwright = { id: 3, name: "Veilwright", colour: "violet", image: null };
const emberroot = { id: 4, name: "Emberroot", colour: "amber", image: null };

const basePage: DhClassPage = {
  dhClass: {
    id: 7,
    name: "Lamplighter",
    description: "<p>Keeps the roads lit.</p>",
    domainAId: 3,
    domainBId: 4,
    startingEvasion: 10,
    startingHp: 6,
    classItems: null,
    hopeFeatureName: "Kindle",
    hopeFeatureText: "<p>Light every lamp at once.</p>",
    origin: "homebrew",
    features: [
      { id: 1, classId: 7, position: 1, name: "Wick", text: "<p>First.</p>" },
      { id: 2, classId: 7, position: 2, name: "Flue", text: "<p>Second.</p>" },
    ],
  },
  domains: [veilwright, emberroot],
  subclasses: [],
  cards: [],
};

const withSubclassAndCards: DhClassPage = {
  ...basePage,
  subclasses: [
    {
      id: 11,
      classId: 7,
      name: "Glass Warden",
      description: null,
      spellcastTrait: "instinct",
      origin: "homebrew",
      features: [
        {
          id: 23,
          subclassId: 11,
          tier: DhSubclassFeatureTier.Mastery,
          position: 1,
          name: "Cathedral",
          text: "<p>M</p>",
        },
        {
          id: 21,
          subclassId: 11,
          tier: DhSubclassFeatureTier.Foundation,
          position: 1,
          name: "Pane",
          text: "<p>F</p>",
        },
      ],
    },
  ],
  cards: [
    {
      id: 31,
      name: "Lantern Step",
      domainId: 3,
      cardLevel: 1,
      recallCost: 0,
      cardType: "spell",
      featureText: "<p>C</p>",
      origin: "homebrew",
      domain: veilwright,
    },
    {
      id: 32,
      name: "Coal Heart",
      domainId: 4,
      cardLevel: 3,
      recallCost: 1,
      cardType: "ability",
      featureText: "<p>D</p>",
      origin: "homebrew",
      domain: emberroot,
    },
  ],
};

const section = (name: string) =>
  screen.getByRole("region", { name: new RegExp(`^${name}$`) });

describe("DhClassPageView (SPEC-021 T6)", () => {
  it("shows the class, its domains as links, and its features in order", () => {
    render(<DhClassPageView page={basePage} system="daggerheart" />);

    expect(
      screen.getByRole("heading", { level: 1, name: "Lamplighter" })
    ).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "Veilwright" })).toHaveAttribute(
      "href",
      "/dashboard/daggerheart/domains/3"
    );
    expect(screen.getByRole("link", { name: "Emberroot" })).toHaveAttribute(
      "href",
      "/dashboard/daggerheart/domains/4"
    );
    expect(
      within(section("dhClasses.features.title"))
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent)
    ).toEqual(["Wick", "Flue"]);
  });

  it("shows the Hope feature with its fixed cost of 3 Hope", () => {
    render(<DhClassPageView page={basePage} system="daggerheart" />);
    const hope = section("dhClasses.hopeFeature.legend");

    expect(
      within(hope).getByRole("heading", { level: 3, name: "Kindle" })
    ).toBeInTheDocument();
    expect(
      within(hope).getByText("dhClasses.hopeFeature.cost")
    ).toBeInTheDocument();
    expect(
      within(hope).getByText("Light every lamp at once.")
    ).toBeInTheDocument();
  });

  it("says so when the class has no subclasses and its domains no cards", () => {
    render(<DhClassPageView page={basePage} system="daggerheart" />);

    expect(
      within(section("dhSubclasses.page.title")).getByText(
        "dhClasses.classPage.noSubclasses"
      )
    ).toBeInTheDocument();
    expect(
      within(section("dhClasses.classPage.domainCards")).getByText(
        "page.emptyMessage"
      )
    ).toBeInTheDocument();
  });

  it("groups a subclass's features by tier, foundation first, skipping empty tiers", () => {
    render(
      <DhClassPageView page={withSubclassAndCards} system="daggerheart" />
    );
    const subclass = screen.getByRole("region", { name: "Glass Warden" });

    expect(subclass).toHaveAttribute("aria-labelledby", "subclass-11");
    expect(
      within(subclass)
        .getAllByRole("heading", { level: 4 })
        .map((h) => h.textContent)
    ).toEqual(["dhSubclasses.tiers.foundation", "dhSubclasses.tiers.mastery"]);
    expect(
      within(subclass)
        .getAllByRole("heading", { level: 5 })
        .map((h) => h.textContent)
    ).toEqual(["Pane", "Cathedral"]);
    expect(
      within(subclass).getByText(/dhSubclasses\.spellcastTraits\.instinct/)
    ).toBeInTheDocument();
  });

  it("shows both domains' cards grouped by level as card views", () => {
    render(
      <DhClassPageView page={withSubclassAndCards} system="daggerheart" />
    );
    const cards = section("dhClasses.classPage.domainCards");

    expect(
      within(cards)
        .getAllByRole("heading", { level: 3 })
        .map((h) => h.textContent)
    ).toEqual(["card.level(1)", "card.level(3)"]);
    expect(
      within(cards).getByRole("article", { name: "Lantern Step" })
    ).toBeInTheDocument();
    expect(
      within(cards).getByRole("article", { name: "Coal Heart" })
    ).toBeInTheDocument();
  });
});

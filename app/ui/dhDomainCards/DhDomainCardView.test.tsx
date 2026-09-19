import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DhDomainCard from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCard";
import DhDomainCardDomain from "@/app/lib/definitions/interfaces/daggerheart/DhDomainCardDomain";

// Keys come back with their values, so the assertions see what is resolved.
vi.mock("next-intl", () => ({
  useTranslations:
    () => (key: string, values?: Record<string, string | number>) =>
      values ? `${key}(${Object.values(values).join(",")})` : key,
}));

import DhDomainCardView from "./DhDomainCardView";
import DhDomainCardsByLevel from "./DhDomainCardsByLevel";

// Invented content only (SPEC-018 §5): no SRD card names or text.
const domain: DhDomainCardDomain = {
  id: 3,
  name: "Veilwright",
  colour: "violet",
  image: { displayKey: "d.webp", thumbKey: "t.webp", width: 80, height: 80 },
};

const card: DhDomainCard = {
  id: 1,
  name: "Lantern Step",
  domainId: 3,
  cardLevel: 4,
  recallCost: 2,
  cardType: "grimoire",
  featureText: "<p>Step to a <strong>lit</strong> lantern.</p>",
  origin: "homebrew",
};

describe("DhDomainCardView (SPEC-021 T3)", () => {
  it("is an article named by the card's heading", () => {
    render(<DhDomainCardView card={card} domain={domain} />);

    expect(
      screen.getByRole("article", { name: "Lantern Step" })
    ).toBeInTheDocument();
    expect(
      screen.getByRole("heading", { level: 3, name: "Lantern Step" })
    ).toBeInTheDocument();
  });

  it("shows the level, the recall cost and the type", () => {
    render(<DhDomainCardView card={card} domain={domain} />);
    const article = screen.getByRole("article");

    expect(
      within(article).getByText("dhDomainCards.card.level(4)")
    ).toBeInTheDocument();
    expect(within(article).getByText("2")).toBeInTheDocument();
    expect(
      within(article).getByText("dhDomainCards.types.grimoire")
    ).toBeInTheDocument();
  });

  it("names the domain in text, not by colour alone", () => {
    render(<DhDomainCardView card={card} domain={domain} />);

    expect(screen.getByText("Veilwright")).toBeInTheDocument();
  });

  it("draws the domain's colour band and emblem", () => {
    render(<DhDomainCardView card={card} domain={domain} />);

    expect(screen.getByText("Veilwright").parentElement).toHaveClass(
      "bg-violet-700",
      "text-white"
    );
    expect(screen.getByRole("article")).toHaveClass("border-violet-700");
    expect(
      screen.getByRole("img", {
        name: "dhDomainCards.card.emblemAlt(Veilwright)",
      })
    ).toBeInTheDocument();
  });

  it("renders the feature text formatted", () => {
    render(<DhDomainCardView card={card} domain={domain} />);

    expect(screen.getByText("lit").tagName).toBe("STRONG");
  });

  it("takes the heading level the page needs", () => {
    render(<DhDomainCardView card={card} domain={domain} headingLevel="h2" />);

    expect(
      screen.getByRole("heading", { level: 2, name: "Lantern Step" })
    ).toBeInTheDocument();
  });
});

describe("DhDomainCardsByLevel (SPEC-021 T2)", () => {
  it("groups the cards by level, lowest first", () => {
    render(
      <DhDomainCardsByLevel
        cards={[
          { ...card, id: 1, cardLevel: 1, name: "Wick", domain },
          { ...card, id: 2, cardLevel: 3, name: "Glass Road", domain },
          { ...card, id: 3, cardLevel: 1, name: "Ember Knot", domain },
        ]}
      />
    );

    const levels = screen.getAllByRole("region");
    expect(levels).toHaveLength(2);
    expect(
      within(levels[0]!).getByRole("heading", {
        level: 2,
        name: "card.level(1)",
      })
    ).toBeInTheDocument();
    expect(within(levels[0]!).getAllByRole("article")).toHaveLength(2);
    expect(within(levels[1]!).getByText("Glass Road")).toBeInTheDocument();
  });

  it("shows the empty message for a domain with no cards", () => {
    render(<DhDomainCardsByLevel cards={[]} />);

    expect(screen.getByText("page.emptyMessage")).toBeInTheDocument();
  });
});

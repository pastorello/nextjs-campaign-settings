import { render, screen, within } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import DhClass from "@/app/lib/definitions/interfaces/daggerheart/DhClass";
import DhDomain from "@/app/lib/definitions/interfaces/daggerheart/DhDomain";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));
vi.mock("@/i18n/navigation", () => ({
  Link: ({ href, children }: { href: string; children: React.ReactNode }) => (
    <a href={href}>{children}</a>
  ),
}));
vi.mock("@/app/lib/hooks/useGameSystem", () => ({
  default: () => "daggerheart",
}));

import DhClassLibrary from "./DhClassLibrary";
import DhDomainLibrary from "../dhDomains/DhDomainLibrary";

// Invented content only (SPEC-018 §5).
const dhClass: DhClass = {
  id: 7,
  name: "Lamplighter",
  description: "<p>Keeps the roads lit.</p>",
  domainAId: 3,
  domainBId: 4,
  startingEvasion: 10,
  startingHp: 6,
  classItems: null,
  hopeFeatureName: "Kindle",
  hopeFeatureText: "<p>h</p>",
  origin: "homebrew",
};

describe("DhClassLibrary (SPEC-021 T6)", () => {
  it("links each class to its page and names its two domains", () => {
    render(
      <DhClassLibrary
        items={[
          dhClass,
          { ...dhClass, id: 8, name: "Ashwalker", description: null },
        ]}
        optionBundle={{
          dhDomain: [
            { value: 3, label: "Veilwright" },
            { value: 4, label: "Emberroot" },
          ],
        }}
      />
    );

    const article = screen.getByRole("article", { name: "Lamplighter" });
    expect(within(article).getByRole("link")).toHaveAttribute(
      "href",
      "/dashboard/daggerheart/classes/7"
    );
    expect(article).toHaveTextContent(/Veilwright · Emberroot/);
    expect(within(article).getByText("Keeps the roads lit.")).toBeVisible();
    expect(
      screen.getByRole("article", { name: "Ashwalker" })
    ).toBeInTheDocument();
  });
});

describe("DhDomainLibrary (SPEC-021 T2)", () => {
  it("links each domain to its page", () => {
    const domain: DhDomain = {
      id: 3,
      name: "Veilwright",
      description: "<p>Veils.</p>",
      colour: "violet",
      origin: "homebrew",
      image: null,
    };
    render(<DhDomainLibrary items={[domain]} />);

    const article = screen.getByRole("article", { name: "Veilwright" });
    expect(within(article).getByRole("link")).toHaveAttribute(
      "href",
      "/dashboard/daggerheart/domains/3"
    );
    expect(within(article).getByText("Veils.")).toBeVisible();
  });
});

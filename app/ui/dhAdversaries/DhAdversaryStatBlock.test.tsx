import { render, screen, within } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import DhAdversary from "@/app/lib/definitions/interfaces/daggerheart/DhAdversary";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));
const { search } = vi.hoisted(() => ({ search: { value: "" } }));
vi.mock("next/navigation", () => ({
  useSearchParams: () => new URLSearchParams(search.value),
  usePathname: () => "/it/dashboard/daggerheart/adversaries",
  useRouter: () => ({ replace: vi.fn() }),
}));

import DhAdversaryStatBlock from "./DhAdversaryStatBlock";
import DhAdversaryLibrary from "./DhAdversaryLibrary";

// Invented content only (SPEC-018 §5).
const wraith: DhAdversary = {
  id: 1,
  name: "Lantern Wraith",
  description: "<p>A cold light that walks.</p>",
  tier: 2,
  adversaryType: "skulk",
  hordeDensity: null,
  motives: "<p>Lure, drain, vanish.</p>",
  difficulty: 13,
  majorThreshold: 8,
  severeThreshold: 15,
  hp: 5,
  stress: 3,
  attackModifier: -1,
  attackName: "Chill touch",
  attackRange: "melee",
  attackDamage: "2d6+2",
  attackType: "magic",
  origin: "homebrew",
  image: null,
  experiences: [
    { id: 1, adversaryId: 1, position: 1, name: "Old haunts", bonus: 2 },
  ],
  features: [
    {
      id: 1,
      adversaryId: 1,
      position: 1,
      kind: "reaction",
      fear: true,
      name: "Gutter flame",
      text: "<p>It flares when struck.</p>",
    },
    {
      id: 2,
      adversaryId: 1,
      position: 2,
      kind: "passive",
      fear: false,
      name: "Weightless",
      text: "<p>It leaves no tracks.</p>",
    },
  ],
};

describe("DhAdversaryStatBlock (SPEC-028 §5.3)", () => {
  it("lays out every field, as a table reads it", () => {
    render(<DhAdversaryStatBlock adversary={wraith} />);
    const block = screen.getByRole("article", { name: "Lantern Wraith" });

    expect(
      within(block).getByText(
        'dhAdversaries.statBlock.header {"tier":2,"type":"daggerheart.adversaryTypes.skulk"}'
      )
    ).toBeInTheDocument();
    expect(
      within(block).getByText("A cold light that walks.")
    ).toBeInTheDocument();
    expect(within(block).getByText("Lure, drain, vanish.")).toBeInTheDocument();
    for (const value of ["13", "8/15", "5", "3", "-1"]) {
      expect(within(block).getByText(value)).toBeInTheDocument();
    }
    expect(block).toHaveTextContent(
      "Chill touch · daggerheart.ranges.melee · 2d6+2 daggerheart.damageTypes.magic"
    );
    expect(block).toHaveTextContent("Old haunts +2");
  });

  it("lists the features in order, the Fear one marked", () => {
    render(<DhAdversaryStatBlock adversary={wraith} />);

    const features = screen.getAllByRole("listitem");
    expect(features.map((item) => item.textContent)).toEqual([
      expect.stringContaining("Gutter flame"),
      expect.stringContaining("Weightless"),
    ]);
    expect(
      within(features[0]!).getByText("dhAdversaries.statBlock.fear")
    ).toBeInTheDocument();
    expect(
      within(features[1]!).queryByText("dhAdversaries.statBlock.fear")
    ).toBeNull();
  });

  it("prints a minion's missing thresholds as none, and a horde's density", () => {
    const { unmount } = render(
      <DhAdversaryStatBlock
        adversary={{
          ...wraith,
          adversaryType: "minion",
          majorThreshold: null,
          severeThreshold: null,
        }}
      />
    );
    expect(
      screen.getByText("dhAdversaries.statBlock.noThresholds")
    ).toBeInTheDocument();
    unmount();

    render(
      <DhAdversaryStatBlock
        adversary={{ ...wraith, adversaryType: "horde", hordeDensity: 4 }}
      />
    );
    expect(screen.getByRole("article")).toHaveTextContent(
      'dhAdversaries.statBlock.hordeDensity {"count":4}'
    );
  });
});

describe("DhAdversaryLibrary (SPEC-028 T2)", () => {
  beforeEach(() => {
    search.value = "";
  });

  it("lists rows by default, and stat blocks with ?view=cards", () => {
    const { unmount } = render(<DhAdversaryLibrary items={[wraith]} />);
    expect(screen.getByTestId("dh-adversary-rows")).toHaveTextContent(
      "Lantern Wraith"
    );
    expect(screen.queryByRole("article")).toBeNull();
    unmount();

    search.value = "view=cards";
    render(<DhAdversaryLibrary items={[wraith]} />);
    expect(
      screen.getByRole("heading", { level: 2, name: "Lantern Wraith" })
    ).toBeInTheDocument();
  });
});

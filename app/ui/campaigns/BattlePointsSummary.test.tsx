import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));

import BattlePointsSummary from "./BattlePointsSummary";

const adversary = (adversaryType: string, tier = 2) => ({
  name: "Any",
  adversaryType,
  tier,
});

describe("BattlePointsSummary (SPEC-030 T3)", () => {
  it("shows the spent points against 3 × the party + 2", () => {
    render(
      <BattlePointsSummary
        creatures={[{ quantity: 2, dhAdversary: adversary("standard") }]}
        partySize={4}
        adventureTier={2}
        adjustments={[]}
      />
    );

    expect(
      screen.getByText('scene.battlePoints.summary {"spent":4,"budget":14}')
    ).toBeInTheDocument();
    expect(screen.queryByText(/scene.battlePoints.over/)).toBeNull();
  });

  it("adds the ticked adjustments to the budget and names them", () => {
    render(
      <BattlePointsSummary
        creatures={[]}
        partySize={4}
        adventureTier={2}
        adjustments={["harderOrLonger"]}
      />
    );

    expect(
      screen.getByText('scene.battlePoints.summary {"spent":0,"budget":16}')
    ).toBeInTheDocument();
    expect(
      screen.getByText("daggerheart.battleAdjustments.harderOrLonger")
    ).toBeInTheDocument();
  });

  it("says by how much a fight is over budget", () => {
    render(
      <BattlePointsSummary
        creatures={[{ quantity: 3, dhAdversary: adversary("solo") }]}
        partySize={4}
        adventureTier={2}
        adjustments={[]}
      />
    );

    expect(screen.getByText(/scene.battlePoints.over/)).toHaveTextContent(
      'scene.battlePoints.over {"points":1}'
    );
  });

  it("counts unpriced rows and suggests the lower-tier adjustment", () => {
    render(
      <BattlePointsSummary
        creatures={[
          { quantity: 1, dhAdversary: null },
          { quantity: 1, dhAdversary: adversary("standard", 1) },
        ]}
        partySize={4}
        adventureTier={2}
        adjustments={[]}
      />
    );

    expect(
      screen.getByText('scene.battlePoints.unpriced {"count":1}')
    ).toBeInTheDocument();
    expect(
      screen.getByText("scene.battlePoints.lowerTierSuggestion")
    ).toBeInTheDocument();
  });
});

import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, values?: Record<string, unknown>) =>
    values ? `${key} ${JSON.stringify(values)}` : key,
}));

import EncounterSummary from "./EncounterSummary";

describe("EncounterSummary (SPEC-031 §5.B)", () => {
  it("shows the fight's XP, the party's three budgets and the band", () => {
    render(
      <EncounterSummary
        creatures={[{ xpEach: 200, quantity: 4 }]}
        partySize={4}
        targetLevel={3}
      />
    );

    expect(
      screen.getByText(
        'scene.encounter.summary {"xp":800,"low":600,"moderate":900,"high":1600}'
      )
    ).toBeInTheDocument();
    expect(
      screen.getByText(
        'scene.encounter.difficulty {"band":"scene.encounter.bands.moderate"}'
      )
    ).toBeInTheDocument();
  });

  it("counts rows with no XP apart, and shows no band when nothing is priced", () => {
    render(
      <EncounterSummary
        creatures={[{ xpEach: null, quantity: 2 }]}
        partySize={4}
        targetLevel={1}
      />
    );

    expect(screen.getByText("scene.encounter.noBand")).toBeInTheDocument();
    expect(
      screen.getByText('scene.encounter.unpriced {"count":1}')
    ).toBeInTheDocument();
  });
});

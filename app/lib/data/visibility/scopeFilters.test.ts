import { describe, expect, it } from "vitest";

import revealedWhere from "./revealedWhere";

describe("revealedWhere (SPEC-022 T7)", () => {
  it("filters nothing for the DM", () => {
    expect(revealedWhere({ kind: "all" })).toEqual({});
  });

  it("keeps what the player's campaign has been shown", () => {
    expect(
      revealedWhere({
        kind: "campaign",
        campaignId: 4,
        zones: new Set(),
        pois: new Set(),
      })
    ).toEqual({ revealedTo: { some: { id: 4 } } });
  });

  it("keeps nothing for a player in no campaign", () => {
    expect(
      revealedWhere({
        kind: "campaign",
        campaignId: null,
        zones: new Set(),
        pois: new Set(),
      })
    ).toEqual({ id: { in: [] } });
  });
});

import { describe, expect, it } from "vitest";

import buildDhEnvironmentWhere from "./buildDhEnvironmentWhere";
import withEnvironmentLinks from "./withEnvironmentLinks";

describe("an environment's links (SPEC-028 T3)", () => {
  it("names its adversaries and places, and lists their ids for the form", () => {
    expect(
      withEnvironmentLinks({
        id: 5,
        adversaries: [{ adversary: { id: 3, name: "Lantern Wraith" } }],
        places: [{ id: 7, title: "Aerivel" }],
      })
    ).toEqual({
      id: 5,
      adversaries: [{ id: 3, name: "Lantern Wraith" }],
      places: [{ id: 7, name: "Aerivel" }],
      environmentAdversaryIds: [3],
      environmentPlaceIds: [7],
    });
  });

  it("turns the place filter into a relation filter, and leaves the rest", () => {
    expect(
      buildDhEnvironmentWhere({
        tier: 2,
        environmentPlaceIds: { hasSome: ["7"] },
      })
    ).toEqual({ tier: 2, places: { some: { id: 7 } } });
    expect(buildDhEnvironmentWhere({ origin: "homebrew" })).toEqual({
      origin: "homebrew",
    });
  });
});

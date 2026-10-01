import { beforeEach, describe, expect, it, vi } from "vitest";

/**
 * SPEC-027 T3: a community's links, its list filters and the world side,
 * for the DM and for a player (SPEC-022), who sees only zone 1 and
 * faction 2.
 */
const ALL = { kind: "all" } as const;
const PLAYER = {
  kind: "campaign" as const,
  campaignId: 7,
  zones: new Set([1]),
  pois: new Set<number>(),
};

const scope = vi.hoisted((): { current: object } => ({ current: {} }));
vi.mock("@/app/lib/data/visibility/getVisibilityScope", () => ({
  default: () => Promise.resolve(scope.current),
}));
const revealed = vi.hoisted(() => ({ ids: null as Set<number> | null }));
vi.mock("@/app/lib/data/visibility/fetchRevealedIds", () => ({
  default: () => Promise.resolve(revealed.ids),
}));
const findMany = vi.hoisted(() => vi.fn());
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { dhCommunity: { findMany } },
}));

import buildDhCommunityWhere from "./buildDhCommunityWhere";
import withCommunityLinks from "./withCommunityLinks";
import fetchFactionCommunities from "./fetchFactionCommunities";
import fetchCommunitiesAtPlace from "./fetchCommunitiesAtPlace";

const row = {
  id: 5,
  places: [
    { id: 1, title: "Aerivel" },
    { id: 3, title: "Secret vale" },
  ],
  factions: [
    { id: 2, name: "Lamplighters" },
    { id: 4, name: "Hidden hand" },
  ],
};

beforeEach(() => {
  vi.clearAllMocks();
  scope.current = ALL;
  revealed.ids = null;
  findMany.mockResolvedValue([]);
});

describe("withCommunityLinks", () => {
  it("gives the DM every link, as names and as the form's ids", () => {
    expect(withCommunityLinks(row, ALL, null)).toMatchObject({
      places: [
        { id: 1, name: "Aerivel" },
        { id: 3, name: "Secret vale" },
      ],
      communityPlaceIds: [1, 3],
      communityFactionIds: [2, 4],
    });
  });

  it("gives a player only the places and factions they may see", () => {
    const result = withCommunityLinks(row, PLAYER, new Set([2]));

    expect(result.places).toEqual([{ id: 1, name: "Aerivel" }]);
    expect(result.factions).toEqual([{ id: 2, name: "Lamplighters" }]);
    expect(result.communityPlaceIds).toEqual([1]);
    expect(result.communityFactionIds).toEqual([2]);
  });
});

describe("buildDhCommunityWhere", () => {
  it("turns the place and faction filters into relation filters", () => {
    expect(
      buildDhCommunityWhere(
        {
          name: { contains: "x" },
          communityPlaceIds: { hasSome: ["3"] },
          communityFactionIds: { hasSome: [4] },
        },
        ALL,
        null
      )
    ).toEqual({
      name: { contains: "x" },
      places: { some: { id: 3 } },
      factions: { some: { id: 4 } },
    });
  });

  it("leaves a where without those filters alone", () => {
    expect(buildDhCommunityWhere({ origin: "homebrew" }, ALL, null)).toEqual({
      origin: "homebrew",
    });
  });

  it("matches nothing for a player filtering by a hidden place or faction", () => {
    const hidden = { some: { id: { in: [] } } };

    expect(
      buildDhCommunityWhere(
        {
          communityPlaceIds: { hasSome: [3] },
          communityFactionIds: { hasSome: [4] },
        },
        PLAYER,
        new Set([2])
      )
    ).toEqual({ places: hidden, factions: hidden });
    expect(
      buildDhCommunityWhere(
        { communityPlaceIds: { hasSome: [1] } },
        PLAYER,
        new Set([2])
      )
    ).toEqual({ places: { some: { id: 1 } } });
  });
});

describe("the world side (§5.6)", () => {
  it("maps each faction to its communities, revealed factions only for a player", async () => {
    findMany.mockResolvedValue([
      { id: 5, name: "Valefolk", factions: [{ id: 2 }, { id: 4 }] },
      { id: 6, name: "Wickborn", factions: [{ id: 2 }] },
    ]);

    expect([...(await fetchFactionCommunities())]).toEqual([
      [
        2,
        [
          { id: 5, name: "Valefolk" },
          { id: 6, name: "Wickborn" },
        ],
      ],
      [4, [{ id: 5, name: "Valefolk" }]],
    ]);

    scope.current = PLAYER;
    revealed.ids = new Set([2]);
    expect([...(await fetchFactionCommunities())].map(([id]) => id)).toEqual([
      2,
    ]);
  });

  it("lists a place's communities, and nothing at a place a player cannot see", async () => {
    findMany.mockResolvedValue([{ id: 5, name: "Valefolk" }]);

    await expect(fetchCommunitiesAtPlace(3)).resolves.toEqual([
      { id: 5, name: "Valefolk" },
    ]);
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({ where: { places: { some: { id: 3 } } } })
    );

    scope.current = PLAYER;
    findMany.mockClear();
    await expect(fetchCommunitiesAtPlace(3)).resolves.toEqual([]);
    expect(findMany).not.toHaveBeenCalled();
  });
});

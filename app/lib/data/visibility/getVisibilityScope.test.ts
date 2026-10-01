import { beforeEach, describe, expect, it, vi } from "vitest";

import { UnauthorizedError } from "@/app/lib/auth/requireDm";

vi.mock("@/auth", () => ({ auth: vi.fn() }));

const { getViewer, visiblePlaceIds } = vi.hoisted(() => ({
  getViewer: vi.fn(),
  visiblePlaceIds: vi.fn(),
}));
vi.mock("@/app/lib/auth/getViewer", () => ({ default: getViewer }));
vi.mock("./visiblePlaceIds", () => ({ default: visiblePlaceIds }));

import getVisibilityScope from "./getVisibilityScope";

describe("getVisibilityScope (SPEC-022 T7)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("refuses a request without a session", async () => {
    getViewer.mockResolvedValue(null);

    await expect(getVisibilityScope()).rejects.toBeInstanceOf(
      UnauthorizedError
    );
  });

  it("is everything for the DM, with no tree read", async () => {
    getViewer.mockResolvedValue({ kind: "dm", userId: "dm" });

    await expect(getVisibilityScope()).resolves.toEqual({ kind: "all" });
    expect(visiblePlaceIds).not.toHaveBeenCalled();
  });

  it("is the campaign's places for a player", async () => {
    getViewer.mockResolvedValue({
      kind: "player",
      userId: "p",
      campaigns: [],
      campaign: { id: 4, title: "Ashes", system: "dnd5e" },
    });
    visiblePlaceIds.mockResolvedValue({
      zones: new Set([1]),
      pois: new Set([9]),
    });

    await expect(getVisibilityScope()).resolves.toEqual({
      kind: "campaign",
      campaignId: 4,
      zones: new Set([1]),
      pois: new Set([9]),
    });
    expect(visiblePlaceIds).toHaveBeenCalledWith(4);
  });

  it("is nothing for a player in no campaign", async () => {
    getViewer.mockResolvedValue({
      kind: "player",
      userId: "p",
      campaigns: [],
      campaign: null,
    });

    await expect(getVisibilityScope()).resolves.toEqual({
      kind: "campaign",
      campaignId: null,
      zones: new Set(),
      pois: new Set(),
    });
  });
});

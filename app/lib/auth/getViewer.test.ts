import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
const { findMany, cookieValue } = vi.hoisted(() => ({
  findMany: vi.fn(),
  cookieValue: { current: undefined as string | undefined },
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { campaign: { findMany } },
}));
vi.mock("next/headers", () => ({
  cookies: () =>
    Promise.resolve({
      get: () =>
        cookieValue.current === undefined
          ? undefined
          : { value: cookieValue.current },
    }),
}));

import getViewer from "./getViewer";

const ashes = { id: 1, title: "Ashes", system: "dnd5e" };
const embers = { id: 2, title: "Embers", system: "daggerheart" };

describe("getViewer (SPEC-022 T7)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    cookieValue.current = undefined;
    findMany.mockResolvedValue([ashes, embers]);
  });

  it("is null without a session", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(getViewer()).resolves.toBeNull();
  });

  it("is the DM, without reading any campaign", async () => {
    vi.mocked(auth).mockResolvedValue({
      user: { id: "dm", role: "dm" },
    } as never);

    await expect(getViewer()).resolves.toEqual({ kind: "dm", userId: "dm" });
    expect(findMany).not.toHaveBeenCalled();
  });

  describe("a player", () => {
    beforeEach(() => {
      vi.mocked(auth).mockResolvedValue({
        user: { id: "p", role: "player" },
      } as never);
    });

    it("views their first campaign by default", async () => {
      await expect(getViewer()).resolves.toEqual({
        kind: "player",
        userId: "p",
        campaigns: [ashes, embers],
        campaign: ashes,
      });
      expect(findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { members: { some: { id: "p" } } },
        })
      );
    });

    it("views the campaign the cookie names, when they are in it", async () => {
      cookieValue.current = "2";

      await expect(getViewer()).resolves.toMatchObject({ campaign: embers });
    });

    // The cookie is a preference: one naming another table's campaign
    // must not show that campaign.
    it("ignores a cookie naming a campaign they are not in", async () => {
      cookieValue.current = "99";

      await expect(getViewer()).resolves.toMatchObject({ campaign: ashes });
    });

    it("views nothing when they play in no campaign", async () => {
      findMany.mockResolvedValue([]);

      await expect(getViewer()).resolves.toMatchObject({
        campaigns: [],
        campaign: null,
      });
    });
  });
});

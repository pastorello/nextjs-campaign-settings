import { beforeEach, describe, expect, it, vi } from "vitest";

const findMany = vi.hoisted(() => vi.fn());
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { campaign: { findMany } },
}));

import playerSystems from "./playerSystems";

describe("playerSystems (SPEC-022 §8)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("is null for a player in no campaign", async () => {
    findMany.mockResolvedValue([]);

    await expect(playerSystems("u1", null)).resolves.toBeNull();
    expect(findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        where: { members: { some: { id: "u1" } } },
      })
    );
  });

  it("names the systems, and the first campaign's as the current one", async () => {
    findMany.mockResolvedValue([
      { id: 2, system: "daggerheart" },
      { id: 1, system: "dnd5e" },
    ]);

    const result = await playerSystems("u1", null);

    expect(result?.current).toBe("daggerheart");
    expect([...(result?.systems ?? [])].sort()).toEqual([
      "daggerheart",
      "dnd5e",
    ]);
  });

  it("follows the cookie's campaign when the player is in it", async () => {
    findMany.mockResolvedValue([
      { id: 2, system: "daggerheart" },
      { id: 1, system: "dnd5e" },
    ]);

    await expect(playerSystems("u1", 1)).resolves.toMatchObject({
      current: "dnd5e",
    });
    await expect(playerSystems("u1", 99)).resolves.toMatchObject({
      current: "daggerheart",
    });
  });

  it("leaves the decision to the layout when the database cannot be read", async () => {
    vi.spyOn(console, "error").mockImplementation(() => {});
    findMany.mockRejectedValue(new Error("down"));

    await expect(playerSystems("u1", null)).resolves.toBeNull();
  });
});

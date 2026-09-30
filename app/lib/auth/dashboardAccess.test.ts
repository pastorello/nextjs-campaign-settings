import { beforeEach, describe, expect, it, vi } from "vitest";

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { users: { findUnique } },
}));

import dashboardAccess from "./dashboardAccess";

describe("dashboardAccess (SPEC-022 T1)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("reads the role from the row, not the token", async () => {
    findUnique.mockResolvedValue({ role: "player", active: true });

    await expect(dashboardAccess({ sub: "u1", role: "dm" })).resolves.toBe(
      "player"
    );
    expect(findUnique).toHaveBeenCalledWith({
      where: { id: "u1" },
      select: { role: true, active: true },
    });
  });

  it("lets the DM in", async () => {
    findUnique.mockResolvedValue({ role: "dm", active: true });

    await expect(dashboardAccess({ sub: "u1" })).resolves.toBe("dm");
  });

  it.each([
    ["a disabled account", { role: "dm", active: false }],
    ["a deleted account", null],
  ])("treats %s as signed out", async (_, row) => {
    findUnique.mockResolvedValue(row);

    await expect(dashboardAccess({ sub: "u1", role: "dm" })).resolves.toBe(
      "none"
    );
  });

  it("treats a token naming no account as signed out", async () => {
    await expect(dashboardAccess({})).resolves.toBe("none");
    expect(findUnique).not.toHaveBeenCalled();
  });

  it.each([
    ["player", "player"],
    ["dm", "dm"],
    [undefined, "dm"],
  ] as const)(
    "falls back to the token's role (%s) when the database is down",
    async (role, expected) => {
      findUnique.mockRejectedValue(new Error("ECONNREFUSED"));
      const consoleError = vi
        .spyOn(console, "error")
        .mockImplementation(() => {});

      await expect(dashboardAccess({ sub: "u1", role })).resolves.toBe(
        expected
      );
      consoleError.mockRestore();
    }
  );
});

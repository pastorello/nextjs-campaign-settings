import { beforeEach, describe, expect, it, vi } from "vitest";
import type { Session } from "next-auth";

const { findUnique } = vi.hoisted(() => ({ findUnique: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { users: { findUnique } },
}));

import { jwt, session } from "./sessionCallbacks";

describe("jwt callback (SPEC-022 T1)", () => {
  beforeEach(() => vi.clearAllMocks());

  it("takes the role from the row at sign-in, without a query", async () => {
    const token = await jwt({
      token: { sub: "u1" },
      user: { id: "u1", role: "dm" },
    });

    expect(token).toEqual({ sub: "u1", role: "dm" });
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("refuses a sign-in whose row carries no known role", async () => {
    await expect(
      jwt({ token: { sub: "u1" }, user: { id: "u1", role: "admin" } })
    ).resolves.toBeNull();
  });

  it("re-reads the row on a later call, so a demotion applies at once", async () => {
    findUnique.mockResolvedValue({ role: "player", active: true });

    const token = await jwt({ token: { sub: "u1", role: "dm" } });

    expect(findUnique).toHaveBeenCalledWith({
      where: { id: "u1" },
      select: { role: true, active: true },
    });
    expect(token).toEqual({ sub: "u1", role: "player" });
  });

  // A token issued before roles existed has none; the row supplies it.
  it("fills in the role of a token from before roles", async () => {
    findUnique.mockResolvedValue({ role: "dm", active: true });

    await expect(jwt({ token: { sub: "u1" } })).resolves.toEqual({
      sub: "u1",
      role: "dm",
    });
  });

  it("ends the session of a disabled account", async () => {
    findUnique.mockResolvedValue({ role: "dm", active: false });

    await expect(jwt({ token: { sub: "u1", role: "dm" } })).resolves.toBeNull();
  });

  it("ends the session of a deleted account", async () => {
    findUnique.mockResolvedValue(null);

    await expect(jwt({ token: { sub: "u1", role: "dm" } })).resolves.toBeNull();
  });

  it("ends a session whose token names no account", async () => {
    await expect(jwt({ token: {} })).resolves.toBeNull();
    expect(findUnique).not.toHaveBeenCalled();
  });

  it("keeps the token when the database cannot be reached", async () => {
    findUnique.mockRejectedValue(new Error("ECONNREFUSED"));
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});

    await expect(jwt({ token: { sub: "u1", role: "dm" } })).resolves.toEqual({
      sub: "u1",
      role: "dm",
    });
    consoleError.mockRestore();
  });
});

describe("session callback", () => {
  it("exposes the account's id and role", () => {
    const result = session({
      session: { user: { name: "Mira" }, expires: "" } as Session,
      token: { sub: "u1", role: "player" },
    });

    expect(result.user).toMatchObject({ id: "u1", role: "player" });
  });
});

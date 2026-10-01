import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";
import { auth } from "@/auth";
import { ForbiddenError, UnauthorizedError } from "@/app/lib/auth/requireDm";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

const { users, leavesNoActiveDm, compare } = vi.hoisted(() => ({
  users: {
    create: vi.fn(),
    update: vi.fn(),
    updateMany: vi.fn(),
    delete: vi.fn(),
    count: vi.fn(),
    findUnique: vi.fn(),
    findMany: vi.fn(),
  },
  leavesNoActiveDm: vi.fn(),
  compare: vi.fn(),
}));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    users,
    // The serializable transaction hands its callback the same client.
    $transaction: (callback: (tx: unknown) => unknown) => callback({ users }),
  },
}));
vi.mock("./leavesNoActiveDm", () => ({ default: leavesNoActiveDm }));
vi.mock("./hashPassword", () => ({
  default: (password: string) => Promise.resolve(`hashed:${password}`),
}));
vi.mock("bcrypt", () => ({ default: { compare } }));

import createAccount from "./createAccount";
import updateAccount from "./updateAccount";
import setAccountActive from "./setAccountActive";
import setAccountPassword from "./setAccountPassword";
import deleteAccount from "./deleteAccount";
import updateOwnName from "./updateOwnName";
import changeOwnPassword from "./changeOwnPassword";
import fetchAccounts from "./fetchAccounts";

const ID = "7f0c1a52-3a51-4f5e-9d8b-2d6f1f7e9a10";
const dm = { user: { id: "me", name: "dm", role: "dm" } };

describe("account actions (SPEC-022 T2, T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue(dm as never);
    users.count.mockResolvedValue(1);
    leavesNoActiveDm.mockResolvedValue(false);
  });

  describe("every action is the DM's", () => {
    const calls = [
      () =>
        createAccount({
          name: "Mira",
          email: "mira@example.test",
          password: "long enough",
          role: "player",
        }),
      () => updateAccount({ id: ID, name: "Mira", role: "player" }),
      () => setAccountActive({ id: ID, active: false }),
      () => setAccountPassword({ id: ID, password: "long enough" }),
      () => deleteAccount({ id: ID }),
      () => updateOwnName({ name: "Mira" }),
      () =>
        changeOwnPassword({ currentPassword: "x", newPassword: "long enough" }),
      () => fetchAccounts(),
    ];

    it.each(calls.map((call, index) => [index, call] as const))(
      "action %i refuses a request without a session",
      async (_, call) => {
        vi.mocked(auth).mockResolvedValue(null as never);
        await expect(call()).rejects.toBeInstanceOf(UnauthorizedError);
      }
    );

    it.each(calls.map((call, index) => [index, call] as const))(
      "action %i refuses a player",
      async (_, call) => {
        vi.mocked(auth).mockResolvedValue({
          user: { id: "p", role: "player" },
        } as never);
        await expect(call()).rejects.toBeInstanceOf(ForbiddenError);
        expect(users.create).not.toHaveBeenCalled();
        expect(users.update).not.toHaveBeenCalled();
        expect(users.delete).not.toHaveBeenCalled();
      }
    );
  });

  describe("createAccount", () => {
    const input = {
      name: " Mira ",
      email: " Mira@Example.TEST ",
      password: "long enough",
      role: "player" as const,
    };

    it("stores a hashed password and a lower-cased, trimmed email", async () => {
      await expect(createAccount(input)).resolves.toEqual({ ok: true });
      expect(users.create).toHaveBeenCalledWith({
        data: {
          name: "Mira",
          email: "mira@example.test",
          role: "player",
          password: "hashed:long enough",
        },
      });
    });

    it("refuses a password shorter than eight characters", async () => {
      const result = await createAccount({ ...input, password: "short" });

      expect(result).toEqual({
        ok: false,
        errors: { password: [{ key: "tooShort", values: { minimum: 8 } }] },
      });
      expect(users.create).not.toHaveBeenCalled();
    });

    it("refuses an unknown role and a malformed email", async () => {
      const result = await createAccount({
        ...input,
        email: "not an email",
        role: "admin" as never,
      });

      expect(result.ok).toBe(false);
      if (!result.ok) {
        expect(Object.keys(result.errors).sort()).toEqual(["email", "role"]);
      }
    });

    it("names the email when another account already uses it", async () => {
      users.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError("Unique constraint", {
          code: "P2002",
          clientVersion: "test",
        })
      );

      await expect(createAccount(input)).resolves.toEqual({
        ok: false,
        errors: { email: [{ key: "emailTaken" }] },
      });
    });
  });

  describe("the last active DM (§5)", () => {
    beforeEach(() => leavesNoActiveDm.mockResolvedValue(true));

    it("cannot be demoted", async () => {
      await expect(
        updateAccount({ id: ID, name: "Last", role: "player" })
      ).resolves.toEqual({
        ok: false,
        errors: { role: [{ key: "lastActiveDm" }] },
      });
      expect(users.update).not.toHaveBeenCalled();
    });

    it("can still be renamed", async () => {
      await expect(
        updateAccount({ id: ID, name: "Last", role: "dm" })
      ).resolves.toEqual({ ok: true });
      expect(users.update).toHaveBeenCalledWith({
        where: { id: ID },
        data: { name: "Last", role: "dm" },
      });
    });

    it("cannot be disabled", async () => {
      await expect(
        setAccountActive({ id: ID, active: false })
      ).resolves.toEqual({
        ok: false,
        errors: { active: [{ key: "lastActiveDm" }] },
      });
      expect(users.update).not.toHaveBeenCalled();
    });

    it("cannot be deleted", async () => {
      await expect(deleteAccount({ id: ID })).resolves.toEqual({
        ok: false,
        errors: { id: [{ key: "lastActiveDm" }] },
      });
      expect(users.delete).not.toHaveBeenCalled();
    });
  });

  it("activates an account without asking the last-DM rule", async () => {
    await expect(setAccountActive({ id: ID, active: true })).resolves.toEqual({
      ok: true,
    });
    expect(leavesNoActiveDm).not.toHaveBeenCalled();
    expect(users.update).toHaveBeenCalledWith({
      where: { id: ID },
      data: { active: true },
    });
  });

  it("deletes an account that is not the last active DM", async () => {
    await expect(deleteAccount({ id: ID })).resolves.toEqual({ ok: true });
    expect(users.delete).toHaveBeenCalledWith({ where: { id: ID } });
  });

  it.each([
    ["updateAccount", () => updateAccount({ id: ID, name: "M", role: "dm" })],
    ["setAccountActive", () => setAccountActive({ id: ID, active: true })],
    ["deleteAccount", () => deleteAccount({ id: ID })],
  ])("%s names a missing account", async (_, call) => {
    users.count.mockResolvedValue(0);

    await expect(call()).resolves.toEqual({
      ok: false,
      errors: { id: [{ key: "accountNotFound" }] },
    });
  });

  describe("setAccountPassword (the hand-performed reset, §9)", () => {
    it("stores the new password hashed", async () => {
      users.updateMany.mockResolvedValue({ count: 1 });

      await expect(
        setAccountPassword({ id: ID, password: "long enough" })
      ).resolves.toEqual({ ok: true });
      expect(users.updateMany).toHaveBeenCalledWith({
        where: { id: ID },
        data: { password: "hashed:long enough" },
      });
    });

    it("names a missing account", async () => {
      users.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        setAccountPassword({ id: ID, password: "long enough" })
      ).resolves.toEqual({
        ok: false,
        errors: { id: [{ key: "accountNotFound" }] },
      });
    });

    it("refuses a short password", async () => {
      const result = await setAccountPassword({ id: ID, password: "short" });

      expect(result.ok).toBe(false);
      expect(users.updateMany).not.toHaveBeenCalled();
    });
  });

  describe("updateOwnName", () => {
    it("renames the session's account, never one the client names", async () => {
      await expect(updateOwnName({ name: " New Name " })).resolves.toEqual({
        ok: true,
      });
      expect(users.update).toHaveBeenCalledWith({
        where: { id: "me" },
        data: { name: "New Name" },
      });
    });

    it("refuses an empty name", async () => {
      const result = await updateOwnName({ name: "   " });

      expect(result.ok).toBe(false);
      expect(users.update).not.toHaveBeenCalled();
    });
  });

  describe("changeOwnPassword", () => {
    beforeEach(() => users.findUnique.mockResolvedValue({ password: "hash" }));

    it("changes the password when the current one matches", async () => {
      compare.mockResolvedValue(true);

      await expect(
        changeOwnPassword({
          currentPassword: "old secret",
          newPassword: "new secret",
        })
      ).resolves.toEqual({ ok: true });
      expect(compare).toHaveBeenCalledWith("old secret", "hash");
      expect(users.update).toHaveBeenCalledWith({
        where: { id: "me" },
        data: { password: "hashed:new secret" },
      });
    });

    it("refuses a wrong current password", async () => {
      compare.mockResolvedValue(false);

      await expect(
        changeOwnPassword({
          currentPassword: "guess",
          newPassword: "new secret",
        })
      ).resolves.toEqual({
        ok: false,
        errors: { currentPassword: [{ key: "wrongPassword" }] },
      });
      expect(users.update).not.toHaveBeenCalled();
    });
  });

  it("fetchAccounts lists every account by name", async () => {
    users.findMany.mockResolvedValue([
      { id: "1", name: "A", email: "a@x.test", role: "dm", active: true },
    ]);

    await expect(fetchAccounts()).resolves.toEqual([
      { id: "1", name: "A", email: "a@x.test", role: "dm", active: true },
    ]);
    expect(users.findMany).toHaveBeenCalledWith({
      select: { id: true, name: true, email: true, role: true, active: true },
      orderBy: [{ name: "asc" }, { email: "asc" }],
    });
  });
});

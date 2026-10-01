import { beforeEach, describe, expect, it, vi } from "vitest";

import { Prisma } from "@/generated/prisma/client";

const { create } = vi.hoisted(() => ({ create: vi.fn() }));
vi.mock("@/app/lib/connections/prisma", () => ({
  default: { users: { create } },
}));
vi.mock("./hashPassword", () => ({
  default: (password: string) => Promise.resolve(`hashed:${password}`),
}));
// No session is ever asked for: a sign-up has none.
vi.mock("@/auth", () => ({
  auth: () => {
    throw new Error("requestDmAccount must not read the session");
  },
}));

import requestDmAccount from "./requestDmAccount";

const input = {
  name: "Aldo",
  email: " Aldo@Example.TEST ",
  password: "long enough",
};

describe("requestDmAccount (SPEC-022 T4)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    create.mockResolvedValue({});
  });

  it("creates an inactive DM without a session", async () => {
    await expect(requestDmAccount(input)).resolves.toEqual({ ok: true });
    expect(create).toHaveBeenCalledWith({
      data: {
        name: "Aldo",
        email: "aldo@example.test",
        role: "dm",
        active: false,
        password: "hashed:long enough",
      },
    });
  });

  it("never takes a role or an active flag from the client", async () => {
    await requestDmAccount({
      ...input,
      role: "player",
      active: true,
    } as never);

    const [{ data }] = create.mock.calls[0] as [
      { data: { role: string; active: boolean } },
    ];
    expect(data).toMatchObject({ role: "dm", active: false });
  });

  // An existing address must not be distinguishable from a new one.
  it("answers a taken email exactly like a new one", async () => {
    create.mockRejectedValue(
      new Prisma.PrismaClientKnownRequestError("Unique constraint", {
        code: "P2002",
        clientVersion: "test",
      })
    );

    await expect(requestDmAccount(input)).resolves.toEqual({ ok: true });
  });

  it("reports malformed fields, and writes nothing", async () => {
    const result = await requestDmAccount({
      name: "",
      email: "nope",
      password: "short",
    });

    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(Object.keys(result.errors).sort()).toEqual([
        "email",
        "name",
        "password",
      ]);
    }
    expect(create).not.toHaveBeenCalled();
  });

  it("rethrows any other database failure", async () => {
    create.mockRejectedValue(new Error("ECONNREFUSED"));

    await expect(requestDmAccount(input)).rejects.toThrow();
  });
});

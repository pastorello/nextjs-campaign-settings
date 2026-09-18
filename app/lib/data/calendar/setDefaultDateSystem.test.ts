import { beforeEach, describe, expect, it, vi } from "vitest";

import { auth } from "@/auth";
import { UnauthorizedError } from "@/app/lib/auth/requireSession";

vi.mock("@/auth", () => ({ auth: vi.fn() }));
vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

/**
 * A minimal in-memory `dateSystem` table behind the mock, so the tests can
 * assert the invariant itself — exactly one default after every call —
 * rather than only which writes were issued. `$transaction` snapshots the
 * rows and restores them when the callback throws, as Postgres would.
 */
const { rows, client } = vi.hoisted(() => {
  const rows: { id: number; isDefault: boolean }[] = [];
  type Where = { id?: number | { not: number }; isDefault?: boolean };
  const matches = (row: (typeof rows)[number], where: Where) =>
    (where.isDefault === undefined || row.isDefault === where.isDefault) &&
    (where.id === undefined ||
      (typeof where.id === "number"
        ? row.id === where.id
        : row.id !== where.id.not));
  const dateSystem = {
    updateMany: vi.fn(
      ({ where, data }: { where: Where; data: { isDefault: boolean } }) => {
        const hit = rows.filter((row) => matches(row, where));
        hit.forEach((row) => (row.isDefault = data.isDefault));
        return Promise.resolve({ count: hit.length });
      }
    ),
  };
  const client = {
    dateSystem,
    $transaction: async (fn: (tx: unknown) => Promise<unknown>) => {
      const snapshot = rows.map((row) => ({ ...row }));
      try {
        return await fn(client);
      } catch (error) {
        rows.splice(0, rows.length, ...snapshot);
        throw error;
      }
    },
  };
  return { rows, client };
});
vi.mock("@/app/lib/connections/prisma", () => ({ default: client }));

import setDefaultDateSystem from "./setDefaultDateSystem";

const defaults = () => rows.filter((row) => row.isDefault).map((row) => row.id);

describe("setDefaultDateSystem (SPEC-014 T3)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(auth).mockResolvedValue({ user: { name: "dm" } } as never);
    rows.splice(
      0,
      rows.length,
      { id: 1, isDefault: true },
      { id: 2, isDefault: false },
      { id: 3, isDefault: false }
    );
  });

  it("rejects an unauthenticated request without writing", async () => {
    vi.mocked(auth).mockResolvedValue(null as never);

    await expect(setDefaultDateSystem(2)).rejects.toBeInstanceOf(
      UnauthorizedError
    );
    expect(client.dateSystem.updateMany).not.toHaveBeenCalled();
    expect(defaults()).toEqual([1]);
  });

  it("moves the default, leaving exactly one", async () => {
    expect(await setDefaultDateSystem(2)).toEqual({ ok: true });
    expect(defaults()).toEqual([2]);

    expect(await setDefaultDateSystem(3)).toEqual({ ok: true });
    expect(defaults()).toEqual([3]);
  });

  it("clears the old default before setting the new one, which the unique index needs", async () => {
    await setDefaultDateSystem(2);

    const calls = client.dateSystem.updateMany.mock.calls.map(
      ([args]) => args.data.isDefault
    );
    expect(calls).toEqual([false, true]);
  });

  it("is a no-op, not a refusal, on the current default", async () => {
    expect(await setDefaultDateSystem(1)).toEqual({ ok: true });
    expect(defaults()).toEqual([1]);
  });

  it("refuses a missing system and rolls back, so the old default survives", async () => {
    expect(await setDefaultDateSystem(99)).toEqual({
      ok: false,
      errors: { id: [{ key: "dateSystemNotFound" }] },
    });
    expect(defaults()).toEqual([1]);
  });

  it("refuses a malformed id without writing", async () => {
    expect(await setDefaultDateSystem(0)).toEqual({
      ok: false,
      errors: { id: [{ key: "invalidType" }] },
    });
    expect(client.dateSystem.updateMany).not.toHaveBeenCalled();
  });
});

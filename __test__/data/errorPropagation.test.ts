import { beforeEach, describe, expect, it, vi } from "vitest";

import DatabaseError from "@/app/lib/errors/DatabaseError";
import DatabaseUnreachableError from "@/app/lib/errors/DatabaseUnreachableError";
import NotFoundError from "@/app/lib/errors/NotFoundError";

vi.mock("@/app/lib/connections/prisma", () => ({
  default: {
    $transaction: vi.fn(),
    spells: { findUnique: vi.fn(), delete: vi.fn(), count: vi.fn() },
    magicitems: { count: vi.fn() },
    png: { count: vi.fn() },
    deities: { count: vi.fn() },
  },
}));

import prisma from "@/app/lib/connections/prisma";
import fetchCardData from "@/app/lib/data/fetchCardData";
import { deleteSpellById } from "@/app/lib/data/spells/deleteSpellById";

/**
 * The class-level behaviour is covered in app/lib/errors/errors.test.ts. What
 * these assert is that the *call sites* use it — that nobody quietly restores
 * `console.error(error); throw new Error("Failed to fetch …")`, which is the
 * pattern TD-13 exists to remove and which no type check would object to.
 */
describe("error propagation from the data layer", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("reports a refused connection as unreachable, not as a failed query", async () => {
    const refused = new Error("connect ECONNREFUSED 127.0.0.1:5432");
    vi.mocked(prisma.$transaction).mockRejectedValue(refused);

    // With Postgres stopped, the dashboard used to fail with nothing but
    // "Failed to fetch card data." — diagnosing it meant running `docker ps`.
    // TD-13 preserved the cause; TD-25 makes the *kind* explicit, so the UI can
    // say "start the database" rather than "something went wrong".
    const error = await fetchCardData().catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(DatabaseUnreachableError);
    expect((error as DatabaseUnreachableError).cause).toBe(refused);
    expect((error as DatabaseUnreachableError).httpStatus).toBe(503);
    expect((error as DatabaseUnreachableError).message).toContain(
      "dashboard counts"
    );
  });

  it("still reports a query that reached the database as a database error", async () => {
    // The distinction has to cut both ways, or it is just a rename.
    const constraint = new Error(
      "duplicate key value violates unique constraint"
    );
    vi.mocked(prisma.$transaction).mockRejectedValue(constraint);

    const error = await fetchCardData().catch((thrown: unknown) => thrown);

    expect(error).toBeInstanceOf(DatabaseError);
    expect(error).not.toBeInstanceOf(DatabaseUnreachableError);
    expect((error as DatabaseError).httpStatus).toBe(500);
  });

  it("deleteSpellById distinguishes a missing row from a failed query", async () => {
    vi.mocked(prisma.spells.findUnique).mockResolvedValue(null as never);

    await expect(deleteSpellById(999999)).rejects.toBeInstanceOf(NotFoundError);
    expect(prisma.spells.delete).not.toHaveBeenCalled();
  });

  it("deleteSpellById reports a failed lookup as a database error", async () => {
    const boom = new Error('relation "spells" does not exist');
    vi.mocked(prisma.spells.findUnique).mockRejectedValue(boom);

    await expect(deleteSpellById(1)).rejects.toMatchObject({ cause: boom });
  });
});

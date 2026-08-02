import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// Direct reference, not `vi.mocked(prisma.$queryRaw)` — the latter trips
// `unbound-method`, same as `createPoi.test.ts` documents for `prisma.poi.create`.
const { queryRaw } = vi.hoisted(() => ({ queryRaw: vi.fn() }));
vi.mock("./prisma", () => ({
  default: { $queryRaw: queryRaw },
}));

import checkDatabaseReachable from "./checkDatabaseReachable";

describe("checkDatabaseReachable", () => {
  const originalUrl = process.env.DATABASE_URL;

  beforeEach(() => {
    vi.clearAllMocks();
  });

  afterEach(() => {
    process.env.DATABASE_URL = originalUrl;
    vi.restoreAllMocks();
  });

  it("returns true when the query succeeds", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    queryRaw.mockResolvedValue([{ "?column?": 1 }]);

    await expect(checkDatabaseReachable()).resolves.toBe(true);
    expect(consoleError).not.toHaveBeenCalled();
  });

  it("returns false and names the host/port when nothing is listening", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    process.env.DATABASE_URL = "postgresql://user:pw@db.example.com:5433/app";
    queryRaw.mockRejectedValue(
      Object.assign(new Error("connect ECONNREFUSED"), {
        code: "ECONNREFUSED",
      })
    );

    await expect(checkDatabaseReachable()).resolves.toBe(false);

    const logged = consoleError.mock.calls[0]?.[0] as string;
    expect(logged).toContain("db.example.com:5433");
    expect(logged).toContain("Nothing is listening there");
  });

  it("defaults to port 5432 when the connection string omits one", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    process.env.DATABASE_URL = "postgresql://user:pw@db.example.com/app";
    queryRaw.mockRejectedValue(
      Object.assign(new Error("connect ECONNREFUSED"), {
        code: "ECONNREFUSED",
      })
    );

    await checkDatabaseReachable();

    const logged = consoleError.mock.calls[0]?.[0] as string;
    expect(logged).toContain("db.example.com:5432");
  });

  it("names an unset DATABASE_URL rather than crashing", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    delete process.env.DATABASE_URL;
    queryRaw.mockRejectedValue(
      Object.assign(new Error("connect ECONNREFUSED"), {
        code: "ECONNREFUSED",
      })
    );

    await checkDatabaseReachable();

    const logged = consoleError.mock.calls[0]?.[0] as string;
    expect(logged).toContain("an unset DATABASE_URL");
  });

  it("names a malformed DATABASE_URL rather than crashing", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    process.env.DATABASE_URL = "not a url";
    queryRaw.mockRejectedValue(
      Object.assign(new Error("connect ECONNREFUSED"), {
        code: "ECONNREFUSED",
      })
    );

    await checkDatabaseReachable();

    const logged = consoleError.mock.calls[0]?.[0] as string;
    expect(logged).toContain("a malformed DATABASE_URL");
  });

  it("reports a non-connection failure with the underlying message, not the 'nothing listening' copy", async () => {
    const consoleError = vi
      .spyOn(console, "error")
      .mockImplementation(() => {});
    process.env.DATABASE_URL = "postgresql://user:pw@db.example.com:5432/app";
    queryRaw.mockRejectedValue(new Error('relation "spells" does not exist'));

    await expect(checkDatabaseReachable()).resolves.toBe(false);

    const logged = consoleError.mock.calls[0]?.[0] as string;
    expect(logged).toContain("answered, but rejected the check");
    expect(logged).toContain('relation "spells" does not exist');
  });
});

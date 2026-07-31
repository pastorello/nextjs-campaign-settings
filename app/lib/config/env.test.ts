import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

// `env.ts` parses `process.env` once at import time, so each case needs a
// fresh module instance to observe a different environment.
describe("env", () => {
  const ORIGINAL_ENV = process.env;

  beforeEach(() => {
    vi.resetModules();
    process.env = { ...ORIGINAL_ENV };
  });

  afterEach(() => {
    process.env = ORIGINAL_ENV;
  });

  it("parses a well-formed DATABASE_URL", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";

    const { default: env } = await import("./env");

    expect(env.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/db");
  });

  it("throws, naming the variable, when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;

    await expect(import("./env")).rejects.toThrow(/DATABASE_URL/);
  });

  it("throws when DATABASE_URL is not a valid connection string", async () => {
    process.env.DATABASE_URL = "not-a-url";

    await expect(import("./env")).rejects.toThrow(/DATABASE_URL/);
  });
});

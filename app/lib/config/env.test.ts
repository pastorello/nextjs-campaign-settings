import os from "node:os";
import path from "node:path";
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
    process.env.UPLOAD_DIR = "/var/campaign-settings/maps";

    const { default: env } = await import("./env");

    expect(env.DATABASE_URL).toBe("postgresql://user:pass@localhost:5432/db");
  });

  it("throws, naming the variable, when DATABASE_URL is missing", async () => {
    delete process.env.DATABASE_URL;
    process.env.UPLOAD_DIR = "/var/campaign-settings/maps";

    await expect(import("./env")).rejects.toThrow(/DATABASE_URL/);
  });

  it("throws when DATABASE_URL is not a valid connection string", async () => {
    process.env.DATABASE_URL = "not-a-url";
    process.env.UPLOAD_DIR = "/var/campaign-settings/maps";

    await expect(import("./env")).rejects.toThrow(/DATABASE_URL/);
  });

  it("parses a well-formed, absolute UPLOAD_DIR", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    process.env.UPLOAD_DIR = "/var/campaign-settings/maps";

    const { default: env } = await import("./env");

    expect(env.UPLOAD_DIR).toBe("/var/campaign-settings/maps");
  });

  // TD-66: a relative UPLOAD_DIR resolves against process.cwd(), which
  // differs between checkouts of this repo sharing one DATABASE_URL — the
  // exact way an agent worktree's migration run once split map images from
  // the maintainer's own checkout. Rejected outright rather than silently
  // resolved, so the mistake fails at startup instead of on first upload.
  it("throws, naming TD-66, when UPLOAD_DIR is a relative path", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    process.env.UPLOAD_DIR = "./storage/maps";

    await expect(import("./env")).rejects.toThrow(/TD-66/);
  });

  // Not required: a checkout-independent default (under the home directory,
  // not process.cwd()) applies instead — the same fix TD-66 asked for, just
  // exercised on the "never configured it" path rather than the "configured
  // it wrong" path above.
  it("defaults UPLOAD_DIR to a fixed, home-anchored path when unset", async () => {
    process.env.DATABASE_URL = "postgresql://user:pass@localhost:5432/db";
    delete process.env.UPLOAD_DIR;

    const { default: env } = await import("./env");

    expect(env.UPLOAD_DIR).toBe(
      path.join(os.homedir(), ".campaign-settings", "storage", "maps")
    );
    expect(path.isAbsolute(env.UPLOAD_DIR)).toBe(true);
  });
});

import { existsSync, readFileSync } from "node:fs";
import path from "node:path";
import dotenv from "dotenv";
import { defineConfig, devices } from "@playwright/test";

/**
 * E2E configuration — see docs/TESTING.md §E2E and TECH_DEBT.md TD-24.
 *
 * Choices worth explaining, because they look like under- or over-configuration:
 *
 * 1. **One worker, not parallel.** Every spec runs against the same Postgres,
 *    and the CRUD specs create and delete real rows. Parallel workers would
 *    make "the list shows N items" depend on what another worker happened to
 *    be doing. The suite is small enough that serial costs seconds.
 * 2. **Chromium only.** TESTING.md §E2E: add Firefox and WebKit once the suite
 *    is stable. Three browsers on day one is three times the flake to diagnose.
 * 3. **Locally, the spawned server's `DATABASE_URL` comes from `.env.test`,
 *    never `.env`, and the two are required to differ (TD-65).** `.env`'s
 *    database is real — the CRUD specs above have already once written
 *    debris into it. The check below runs at config-load time so a
 *    misconfiguration fails loudly before any test starts, not partway
 *    through a run. In CI there is no `.env`/`.env.test` at all: the job
 *    already provides its own disposable Postgres service and sets
 *    `DATABASE_URL` directly (see `.github/workflows/ci.yml`), so this whole
 *    check is skipped there — it would otherwise demand a file CI never has.
 * 4. **`reuseExistingServer: false`, even locally.** TD-65's incident happened
 *    because a `pnpm dev` was already running on :3000 against the real `.env`,
 *    and Playwright's usual "reuse what's already there" shortcut silently
 *    attached to it instead of spawning the e2e-configured server below. A
 *    stray dev server on :3000 now makes `pnpm test:e2e` fail on a port
 *    conflict instead of writing to the wrong database.
 */

const isCI = !!process.env.CI;
const rootDir = __dirname;

// Only local runs need this: CI has no .env/.env.test, only its own
// job-level DATABASE_URL pointed at a disposable Postgres service.
const webServerEnv = isCI ? undefined : loadLocalE2EDatabaseUrl(rootDir);

function loadLocalE2EDatabaseUrl(dir: string): Record<string, string> {
  const envTestPath = path.resolve(dir, ".env.test");

  if (!existsSync(envTestPath)) {
    throw new Error(
      "playwright.config.ts: .env.test not found. pnpm test:e2e's CRUD specs " +
        "write to a real database and must never point at the one `pnpm dev` " +
        "uses (TD-65). Copy .env.test.example to .env.test and point its " +
        "DATABASE_URL at a separate, throwaway database — see docs/TESTING.md."
    );
  }

  const e2eEnv = dotenv.parse(readFileSync(envTestPath));

  if (!e2eEnv.DATABASE_URL) {
    throw new Error(
      "playwright.config.ts: .env.test has no DATABASE_URL — see .env.test.example."
    );
  }

  const envPath = path.resolve(dir, ".env");
  if (existsSync(envPath)) {
    const devEnv = dotenv.parse(readFileSync(envPath));
    if (devEnv.DATABASE_URL && devEnv.DATABASE_URL === e2eEnv.DATABASE_URL) {
      throw new Error(
        "playwright.config.ts: .env.test's DATABASE_URL is identical to .env's. " +
          "pnpm test:e2e would write to the same database pnpm dev uses (TD-65) " +
          "— point .env.test at a separate, throwaway database."
      );
    }
  }

  return { DATABASE_URL: e2eEnv.DATABASE_URL };
}

export default defineConfig({
  testDir: "./e2e",

  fullyParallel: false,
  workers: 1,

  // A `.only` left in a spec silently narrows CI to one test. Fail instead.
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,

  reporter: process.env.CI
    ? [["html", { open: "never" }], ["github"]]
    : [["html", { open: "never" }], ["list"]],

  use: {
    baseURL: "http://localhost:3000",
    trace: "on-first-retry",
    screenshot: "only-on-failure",
  },

  projects: [
    // Logs in once and saves the session to e2e/.auth/user.json, so the other
    // specs start authenticated instead of re-driving the login form.
    { name: "setup", testMatch: /auth\.setup\.ts/ },

    // auth.spec.ts owns the login flow itself, so it must start signed out —
    // no storageState, and no dependency on the setup project.
    {
      name: "unauthenticated",
      testMatch: /auth\.spec\.ts/,
      use: { ...devices["Desktop Chrome"] },
    },

    // Creates the tree's root place (SPEC-004 M4-M7) so specs that expect
    // an interactive map at /dashboard/geography have one — see
    // world.setup.ts for why db:seed itself doesn't do this.
    {
      name: "world-setup",
      testMatch: /world\.setup\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },

    {
      name: "chromium",
      testIgnore: /auth\.spec\.ts/,
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup", "world-setup"],
    },
  ],

  webServer: {
    command: "pnpm dev",
    url: "http://localhost:3000",
    reuseExistingServer: false,
    timeout: 120_000,
    ...(webServerEnv ? { env: webServerEnv } : {}),
  },
});

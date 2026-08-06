import { defineConfig, devices } from "@playwright/test";

/**
 * E2E configuration — see docs/TESTING.md §E2E and TECH_DEBT.md TD-24.
 *
 * Two choices worth explaining, because both look like under-configuration:
 *
 * 1. **One worker, not parallel.** Every spec runs against the same Postgres,
 *    and the CRUD specs create and delete real rows. Parallel workers would
 *    make "the list shows N items" depend on what another worker happened to
 *    be doing. The suite is small enough that serial costs seconds.
 * 2. **Chromium only.** TESTING.md §E2E: add Firefox and WebKit once the suite
 *    is stable. Three browsers on day one is three times the flake to diagnose.
 */
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
    reuseExistingServer: !process.env.CI,
    timeout: 120_000,
  },
});

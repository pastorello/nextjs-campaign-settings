import { test, expect } from "@playwright/test";

import { TEST_USER } from "./fixtures/testUser";

/**
 * The login flow itself, so this spec runs signed out — see the
 * "unauthenticated" project in playwright.config.ts, which gives it no
 * storageState and no dependency on auth.setup.ts.
 *
 * Covers TD-01 from the outside: the guards have unit tests, this proves the
 * user-visible half.
 */
test.describe("authentication", () => {
  test("valid credentials reach the dashboard", async ({ page }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(TEST_USER.email);
    await page.getByLabel("Password").fill(TEST_USER.password);
    await page.getByRole("button", { name: "Log in" }).click();

    await expect(page).toHaveURL(/\/dashboard$/);
  });

  test("invalid credentials show an error and stay on /login", async ({
    page,
  }) => {
    await page.goto("/login");

    await page.getByLabel("Email").fill(TEST_USER.email);
    await page.getByLabel("Password").fill("wrong-password");
    await page.getByRole("button", { name: "Log in" }).click();

    // The failure must be visible to the user, not only logged server-side —
    // this is the assertion TD-10 exists to keep honest.
    await expect(
      page.getByText(/credenziali|invalid|errore/i).first()
    ).toBeVisible();
    await expect(page).toHaveURL(/\/login/);
  });

  test("an unauthenticated visit to a dashboard page redirects to login", async ({
    page,
  }) => {
    await page.goto("/dashboard/spells");

    await expect(page).toHaveURL(/\/login/);
  });

  /**
   * TD-01 from the outside. This lives here, in the signed-out project, rather
   * than in validation.spec.ts: `request.newContext()` inherits the calling
   * project's storageState, so "anonymous" request contexts created inside an
   * authenticated project are not anonymous at all.
   *
   * The id is deliberately one that cannot exist. If the guard ever regresses,
   * this test must report it — not perform it on a real record.
   */
  test("DELETE on an API route without a session returns 401", async ({
    request,
  }) => {
    const response = await request.delete("/api/spells/999999");

    expect(response.status()).toBe(401);
  });
});

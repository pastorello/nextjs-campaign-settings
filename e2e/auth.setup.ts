import { test as setup, expect } from "@playwright/test";

import { STORAGE_STATE, TEST_USER } from "./fixtures/testUser";

/**
 * Signs in once and writes the session to disk. Every spec except auth.spec.ts
 * starts from that state, so the login form is driven exactly once per run
 * rather than once per test.
 */
setup("authenticate", async ({ page }) => {
  await page.goto("/login");

  await page.getByLabel("Email").fill(TEST_USER.email);
  await page.getByLabel("Password").fill(TEST_USER.password);
  await page.getByRole("button", { name: "Log in" }).click();

  await page.waitForURL("**/dashboard");

  // Proves the session is real rather than just a redirect: the dashboard nav
  // only renders for an authenticated user.
  await expect(
    page.getByRole("link", { name: "Incantesimi", exact: true })
  ).toBeVisible();

  await page.context().storageState({ path: STORAGE_STATE });
});

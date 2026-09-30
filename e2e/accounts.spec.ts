import { test, expect, type Browser, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

const t = messages.accounts;

/** `{name}`-style placeholders, as next-intl fills them. */
function fill(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

/** A signed-out browser, to sign in as the account the test created. */
async function signedOutPage(browser: Browser) {
  const { baseURL } = test.info().project.use;
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
    ...(baseURL !== undefined && { baseURL }),
  });
  return context.newPage();
}

async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(messages.common.auth.email).fill(email);
  await page.getByLabel(messages.common.auth.password).fill(password);
  await page.getByRole("button", { name: messages.common.auth.submit }).click();
}

/**
 * SPEC-022 T2, T3: the DM's accounts page, and what a player's account can
 * do with the dashboard before T7/T8 open it (nothing: the 403 page).
 */
test.describe("accounts", () => {
  test("the DM creates a player, who gets the 403 page, then disables and deletes it", async ({
    page,
    browser,
  }) => {
    const stamp = Date.now();
    const name = `E2E Player ${stamp}`;
    const email = `e2e-player-${stamp}@example.test`;
    const firstPassword = "first secret";
    const secondPassword = "second secret";

    await page.goto("/dashboard/dnd5e/admin/accounts");
    await page.getByLabel(t.page.name, { exact: true }).fill(name);
    await page.getByLabel(t.page.email, { exact: true }).fill(email);
    await page.getByLabel(t.page.password, { exact: true }).fill(firstPassword);
    await page.getByRole("button", { name: t.page.create }).click();
    const row = page.getByRole("row", { name: new RegExp(name) });

    try {
      await expect(row).toContainText(messages.accounts.roles.player);
      await expect(row).toContainText(t.statuses.active);

      // The player signs in and reaches nothing but the 403 page.
      const player = await signedOutPage(browser);
      await signIn(player, email, firstPassword);
      await expect(
        player.getByRole("heading", { name: messages.common.forbidden.title })
      ).toBeVisible();
      const admin = await player.goto("/dashboard/dnd5e/admin/npc");
      expect(admin?.status()).toBe(403);
      expect(await admin?.text()).not.toContain("E2E");
      const deleted = await player.request.delete("/api/npc/999999");
      expect(deleted.status()).toBe(403);

      // The hand-performed reset (SPEC-022 §9).
      await row
        .getByRole("button", { name: fill(t.page.setPassword, { name }) })
        .click();
      await page
        .getByRole("dialog")
        .getByLabel(t.page.password, { exact: true })
        .fill(secondPassword);
      await page
        .getByRole("dialog")
        .getByRole("button", { name: t.page.save })
        .click();
      await expect(page.getByRole("dialog")).toBeHidden();
      await player.context().clearCookies();
      await signIn(player, email, secondPassword);
      await expect(
        player.getByRole("heading", { name: messages.common.forbidden.title })
      ).toBeVisible();

      // Disabled: the open session ends, and signing in again fails.
      await row
        .getByRole("button", { name: fill(t.page.disable, { name }) })
        .click();
      await expect(row).toContainText(t.statuses.inactive);
      await player.goto("/dashboard/dnd5e");
      await expect(player).toHaveURL(/\/login/);
      await signIn(player, email, secondPassword);
      await expect(
        player.getByText(messages.common.auth.invalidCredentials)
      ).toBeVisible();
      await player.context().close();
    } finally {
      await page.goto("/dashboard/dnd5e/admin/accounts");
      const leftover = page.getByRole("row", { name: new RegExp(name) });
      if (await leftover.count()) {
        await leftover
          .getByRole("button", { name: fill(t.page.delete, { name }) })
          .click();
        await page
          .getByRole("dialog")
          .getByRole("button", { name: t.page.confirmDelete })
          .click();
        await expect(leftover).toHaveCount(0);
      }
    }
  });

  test("the last active DM cannot be disabled", async ({ page }) => {
    await page.goto("/dashboard/dnd5e/admin/accounts");
    const self = page.getByRole("row", {
      name: new RegExp(t.page.you.replace(/[()]/g, "\\$&")),
    });
    const selfName = (await self.getByRole("rowheader").innerText())
      .replace(t.page.you, "")
      .trim();

    await self
      .getByRole("button", { name: fill(t.page.disable, { name: selfName }) })
      .click();

    await expect(
      page.getByText(messages.common.fieldErrors.lastActiveDm)
    ).toBeVisible();
    await expect(self).toContainText(t.statuses.active);
  });

  test("the DM renames their own account", async ({ page }) => {
    await page.goto("/dashboard/dnd5e/account");
    // The form is named by its "Nome" heading too, so the field is found by
    // its role.
    const nameField = page.getByRole("textbox", {
      name: t.ownPage.name,
      exact: true,
    });
    const original = await nameField.inputValue();

    try {
      await nameField.fill(`${original} E2E`);
      await page.getByRole("button", { name: t.ownPage.saveName }).click();
      await expect(page.getByText(t.ownPage.nameSaved)).toBeVisible();
      await page.reload();
      await expect(nameField).toHaveValue(`${original} E2E`);
    } finally {
      await nameField.fill(original);
      await page.getByRole("button", { name: t.ownPage.saveName }).click();
      await expect(page.getByText(t.ownPage.nameSaved).first()).toBeVisible();
    }
  });
});

import { test, expect } from "@playwright/test";

import messages from "@/messages/it.json";

import {
  fillTemplate as fill,
  signIn,
  signedOutPage,
} from "./helpers/accounts";

const t = messages.accounts;

/**
 * SPEC-022 T2, T3: the DM's accounts page, and what a player's account can
 * do with the dashboard while it is in no campaign: open the map page, which
 * says so (T7), and nothing else (the 403 page).
 */
test.describe("accounts", () => {
  test("the DM creates a player, who is refused the DM's pages, then disables and deletes it", async ({
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

      // The player signs in and lands on the map page, which says they are
      // in no campaign yet (T7). Every DM page is the 403 page.
      const player = await signedOutPage(browser);
      await signIn(player, email, firstPassword);
      await expect(
        player.getByText(messages.geography.player.noCampaign)
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
        player.getByText(messages.geography.player.noCampaign)
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

  // SPEC-022 T4: the logged-out sign-up, inactive until a DM activates it.
  test("a DM signs up, cannot sign in until activated, then can", async ({
    page,
    browser,
  }) => {
    const stamp = Date.now();
    const name = `E2E New DM ${stamp}`;
    const email = `e2e-new-dm-${stamp}@example.test`;
    const password = "sign up secret";

    const newcomer = await signedOutPage(browser);
    await newcomer.goto("/login");
    await newcomer
      .getByRole("link", { name: messages.common.auth.signUpLink })
      .click();
    await newcomer.getByLabel(t.signUp.name, { exact: true }).fill(name);
    await newcomer.getByLabel(t.signUp.email, { exact: true }).fill(email);
    await newcomer
      .getByLabel(t.signUp.password, { exact: true })
      .fill(password);
    await newcomer.getByRole("button", { name: t.signUp.submit }).click();
    await expect(
      newcomer.getByRole("heading", { name: t.signUp.doneTitle })
    ).toBeVisible();

    try {
      await signIn(newcomer, email, password);
      await expect(
        newcomer.getByText(messages.common.auth.invalidCredentials)
      ).toBeVisible();

      await page.goto("/dashboard/dnd5e/admin/accounts");
      const row = page.getByRole("row", { name: new RegExp(name) });
      await expect(row).toContainText(messages.accounts.roles.dm);
      await expect(row).toContainText(t.statuses.inactive);
      await row
        .getByRole("button", { name: fill(t.page.activate, { name }) })
        .click();
      await expect(row).toContainText(t.statuses.active);

      await signIn(newcomer, email, password);
      await expect(newcomer).toHaveURL(/\/dashboard\/dnd5e$/);
      await newcomer.context().close();
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

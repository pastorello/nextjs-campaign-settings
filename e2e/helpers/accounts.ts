import { test, expect, type Browser, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

const t = messages.accounts.page;

/** `{name}`-style placeholders, as next-intl fills them. */
export function fillTemplate(template: string, values: Record<string, string>) {
  return template.replace(/\{(\w+)\}/g, (_, key: string) => values[key] ?? "");
}

/** Creates a player account from the DM's accounts page (SPEC-022 T3). */
export async function createPlayerAccount(
  page: Page,
  { name, email, password }: { name: string; email: string; password: string }
) {
  await page.goto("/dashboard/dnd5e/admin/accounts");
  await page.getByLabel(t.name, { exact: true }).fill(name);
  await page.getByLabel(t.email, { exact: true }).fill(email);
  await page.getByLabel(t.password, { exact: true }).fill(password);
  await page.getByRole("button", { name: t.create }).click();
  await expect(page.getByRole("row", { name: new RegExp(name) })).toBeVisible();
}

/** Deletes an account from the accounts page, if it is still there. */
export async function deleteAccountIfPresent(page: Page, name: string) {
  await page.goto("/dashboard/dnd5e/admin/accounts");
  const row = page.getByRole("row", { name: new RegExp(name) });
  if (!(await row.count())) return;
  await row
    .getByRole("button", { name: fillTemplate(t.delete, { name }) })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: t.confirmDelete })
    .click();
  await expect(row).toHaveCount(0);
}

/** A signed-out browser, to sign in as an account the test created. */
export async function signedOutPage(browser: Browser) {
  const { baseURL } = test.info().project.use;
  const context = await browser.newContext({
    storageState: { cookies: [], origins: [] },
    ...(baseURL !== undefined && { baseURL }),
  });
  return context.newPage();
}

export async function signIn(page: Page, email: string, password: string) {
  await page.goto("/login");
  await page.getByLabel(messages.common.auth.email).fill(email);
  await page.getByLabel(messages.common.auth.password).fill(password);
  await page.getByRole("button", { name: messages.common.auth.submit }).click();
}

/** Adds a player to the dnd5e campaign from its page (SPEC-022 T5). */
export async function addPlayerToCampaign(page: Page, name: string) {
  const players = messages.campaign.players;
  await page.goto("/dashboard/dnd5e/campaign");
  const section = page.getByRole("region", { name: players.title });
  await section.getByRole("button", { name: players.candidate }).click();
  await page.getByRole("option", { name }).click();
  await section.getByRole("button", { name: players.add }).click();
  await expect(
    section.getByRole("button", {
      name: fillTemplate(players.remove, { name }),
    })
  ).toBeVisible();
}

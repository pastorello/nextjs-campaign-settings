import { test, expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * SPEC-032 T2: several campaigns in one system. Two campaigns are created
 * from the list; each opens on its own page, an adventure added to one is
 * not on the other, and the address decides the system. Campaigns have no
 * delete before T4's archive, so the pair stays in the test database, under
 * titles no other spec looks for.
 */
const LIST = "/dashboard/dnd5e/campaign";
const form = messages.campaign.form;
const adventureFields = messages.adventure.fields;

/** Creates a campaign from the list and returns the page it opens on. */
async function createCampaign(page: Page, title: string): Promise<string> {
  await page.goto(LIST);
  // The create button is client-side; a click that lands before hydration
  // is swallowed (seen on CI, 2026-09-18).
  await page.waitForLoadState("networkidle");
  await page
    .getByLabel(messages.campaign.fields.title.label, { exact: true })
    .fill(title);
  await page.getByRole("button", { name: form.createButton }).click();
  await page.waitForURL(/\/dashboard\/dnd5e\/campaign\/\d+$/);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(title);
  return new URL(page.url()).pathname;
}

test("two campaigns are listed, opened and kept apart", async ({ page }) => {
  const stamp = Date.now();
  const first = `E2E Prima campagna ${stamp}`;
  const second = `E2E Seconda campagna ${stamp}`;
  const adventure = `E2E Avventura ${stamp}`;

  const firstPath = await createCampaign(page, first);
  const secondPath = await createCampaign(page, second);
  expect(secondPath).not.toBe(firstPath);

  // --- Both are on the list, each card opens its own page ---------------
  await page.goto(LIST);
  const cards = page.getByTestId("campaign-list");
  await expect(cards.getByRole("link", { name: first })).toBeVisible();
  await expect(cards.getByRole("link", { name: second })).toBeVisible();
  await cards.getByRole("link", { name: first }).click();
  await page.waitForURL(`**${firstPath}`);

  // --- An adventure of the first is not on the second -------------------
  await page.waitForLoadState("networkidle");
  await page
    .getByRole("button", { name: messages.adventure.ladder.addButton })
    .click();
  const adventureForm = page.locator("form");
  await adventureForm
    .getByLabel(adventureFields.title.label, { exact: true })
    .fill(adventure);
  await adventureForm
    .getByRole("button", { name: messages.adventure.form.createButton })
    .click();
  await expect(page.getByRole("link", { name: adventure })).toBeVisible();

  await page.goto(secondPath);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(second);
  await expect(page.getByRole("link", { name: adventure })).toHaveCount(0);

  // --- The address names the system: another system's URL redirects -----
  await page.goto(secondPath.replace("/dnd5e/", "/daggerheart/"));
  await page.waitForURL(`**${secondPath}`);
  await expect(page.getByRole("heading", { level: 1 })).toHaveText(second);
});

test("a campaign that does not exist is a 404", async ({ page }) => {
  const response = await page.goto(`${LIST}/999999999`);

  expect(response?.status()).toBe(404);
});

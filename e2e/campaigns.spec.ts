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

const archive = messages.campaign.archive;

test("an archived campaign leaves the list, keeps its reveals, and comes back (SPEC-032 T4)", async ({
  page,
}) => {
  const stamp = Date.now();
  const kept = `E2E Archiviata ${stamp}`;
  const other = `E2E Attiva ${stamp}`;
  const npc = `E2E Reveal archivio ${stamp}`;
  const revealedTo = messages.common.fields.revealedTo.label;
  const row = () => page.getByRole("row").filter({ hasText: npc });
  const gotoNpc = async () => {
    await page.goto(
      `/dashboard/dnd5e/admin/npc?query=${encodeURIComponent(npc)}`
    );
    await page.waitForLoadState("networkidle");
  };

  const keptPath = await createCampaign(page, kept);
  await createCampaign(page, other);

  // --- An NPC revealed to both -------------------------------------------
  await page.goto("/dashboard/dnd5e/admin/npc/new");
  await page.waitForLoadState("networkidle");
  await page.getByLabel(messages.common.fields.name.label).fill(npc);
  await page.getByRole("button", { name: revealedTo }).click();
  await page.getByRole("option", { name: kept }).click();
  await page.getByRole("option", { name: other }).click();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: messages.npc.form.createButton })
    .click();
  await page.waitForURL("**/dashboard/dnd5e/admin/npc");

  try {
    // --- Archive the first: off the list, banner on its page -------------
    await page.goto(keptPath);
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: archive.archive }).click();
    await expect(page.getByTestId("archived-banner")).toBeVisible();

    await page.goto(LIST);
    await expect(
      page.getByTestId("campaign-list").getByRole("link", { name: kept })
    ).toHaveCount(0);
    await expect(page.getByTestId("archived-campaigns")).toBeVisible();

    // --- Editing the reveals does not disturb the archived campaign ------
    await gotoNpc();
    await expect(row()).toContainText(other);
    await expect(row()).not.toContainText(kept);
    await row()
      .getByRole("button", { name: messages.common.table.edit })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: revealedTo }).click();
    // The archived campaign is not on offer.
    await expect(page.getByRole("option", { name: kept })).toHaveCount(0);
    await page.getByRole("option", { name: other }).click();
    await page.keyboard.press("Escape");
    await dialog
      .getByRole("button", { name: messages.npc.form.editButton })
      .click();
    await expect(dialog).toHaveCount(0);

    // --- Restored: back on the list, still revealed to it ----------------
    await page.goto(LIST);
    await page.waitForLoadState("networkidle");
    await page.getByTestId("archived-campaigns").locator("summary").click();
    await page
      .getByRole("button", {
        name: messages.campaign.list.archived.restore.replace("{title}", kept),
      })
      .click();
    await expect(
      page.getByTestId("campaign-list").getByRole("link", { name: kept })
    ).toBeVisible();

    await gotoNpc();
    await expect(row()).toContainText(kept);
    await expect(row()).not.toContainText(other);
  } finally {
    await gotoNpc();
    if (await row().count()) {
      await row()
        .getByRole("button", { name: messages.common.form.delete })
        .click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: messages.common.form.delete })
        .click();
      await expect(row()).toHaveCount(0);
    }
  }
});

/**
 * SPEC-032 T5, T6: copying. An adventure is copied into another campaign
 * through the ladder's "Copia in…", then the whole campaign is copied from its
 * header. The copy of the campaign is a new, active campaign carrying the
 * adventure, and the DM lands on it. Copies stay in the test database, under
 * titles no other spec looks for.
 */
test("an adventure and a campaign are copied", async ({ page }) => {
  const stamp = Date.now();
  const source = `E2E Origine ${stamp}`;
  const target = `E2E Destinazione ${stamp}`;
  const adventure = `E2E Avventura copiata ${stamp}`;
  const copy = messages.campaign.copy;

  const sourcePath = await createCampaign(page, source);
  const targetPath = await createCampaign(page, target);

  // --- An adventure in the source ---------------------------------------
  await page.goto(sourcePath);
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

  // --- Copy the adventure into the other campaign -----------------------
  await page.getByRole("button", { name: copy.button }).click();
  const dialog = page.getByRole("dialog");
  await dialog.getByRole("button", { name: /E2E/ }).first().click();
  await page.getByRole("option", { name: target }).click();
  await dialog.getByRole("button", { name: copy.confirm, exact: true }).click();
  await page.waitForURL(/\/dashboard\/dnd5e\/adventure\/\d+/);

  await page.goto(targetPath);
  await expect(page.getByRole("link", { name: adventure })).toBeVisible();

  // --- Copy the whole source campaign -----------------------------------
  await page.goto(sourcePath);
  await page.waitForLoadState("networkidle");
  const started = Date.now();
  await page.getByRole("button", { name: copy.campaignButton }).click();
  await page.waitForURL(
    (url) =>
      /\/dashboard\/dnd5e\/campaign\/\d+$/.test(url.pathname) &&
      url.pathname !== sourcePath
  );
  console.info(`copyCampaign round trip: ${Date.now() - started} ms`);

  await expect(page.getByRole("heading", { level: 1 })).toHaveText(
    copy.titlePrefix.replace("{title}", source)
  );
  await expect(page.getByRole("link", { name: adventure })).toBeVisible();
  await expect(page.getByTestId("archived-banner")).toHaveCount(0);
});

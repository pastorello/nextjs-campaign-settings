import { test, expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * SPEC-027 T2: a Daggerheart ancestry with its two features, refused with
 * one, seen as a card, edited and deleted. Everything it writes is invented
 * (SPEC-018 §5: no SRD content in fixtures), and the row is removed in
 * `finally`, so a failed assertion cannot leave it in the test database.
 */
const ADMIN = "/dashboard/daggerheart/admin/ancestries";
const t = messages.dhAncestries;

const rowFor = (page: Page, name: string) =>
  page.getByRole("row").filter({ hasText: name });

const gotoRow = async (page: Page, name: string) => {
  await page.goto(`${ADMIN}?query=${encodeURIComponent(name)}`);
  // Row buttons open client-side dialogs; a click that lands before
  // hydration is swallowed (seen on CI, 2026-09-18).
  await page.waitForLoadState("networkidle");
};

const deleteRow = async (page: Page, name: string) => {
  await gotoRow(page, name);
  const row = rowFor(page, name);
  if ((await row.count()) === 0) return;
  await row.getByRole("button", { name: messages.common.form.delete }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: messages.common.form.delete })
    .click();
  await expect(row).toHaveCount(0);
};

/** Types into a formatted-text field, found by its label. */
const typeInto = async (page: Page, label: string, text: string) => {
  await page.getByRole("textbox", { name: label }).click();
  await page.keyboard.type(text);
};

test.describe("Daggerheart ancestries", () => {
  test("an ancestry needs both features, shows as a card, and is edited and deleted", async ({
    page,
  }) => {
    const name = `E2E Ascendenza ${Date.now()}`;
    const renamed = `${name} mod`;

    try {
      await page.goto(ADMIN);
      await page.waitForLoadState("networkidle");
      await page.getByRole("link", { name: t.page.newItemButton }).click();
      await expect(
        page.getByRole("heading", { name: t.form.createTitle })
      ).toBeVisible();
      await page.getByLabel(messages.common.fields.name.label).fill(name);
      await page
        .getByLabel(t.fields.featureAName.label, { exact: true })
        .fill("Invented glow");
      await typeInto(
        page,
        t.fields.featureAText.label,
        "Invented first effect."
      );

      // One feature alone is refused, field by field (SPEC-027 §5).
      await page.getByRole("button", { name: t.form.createButton }).click();
      await expect(page).toHaveURL(/\/admin\/ancestries\/new/);
      const summary = page
        .getByRole("alert")
        .filter({ hasText: messages.common.formErrors.title });
      await expect(summary).toContainText(t.fields.featureBName.label);
      await expect(summary).toContainText(t.fields.featureBText.label);

      await page
        .getByLabel(t.fields.featureBName.label, { exact: true })
        .fill("Invented wick");
      await typeInto(
        page,
        t.fields.featureBText.label,
        "Invented second effect."
      );
      await page.getByRole("button", { name: t.form.createButton }).click();
      await page.waitForURL(`**${ADMIN}`);

      // --- The card view ----------------------------------------------------
      await page.goto(
        `/dashboard/daggerheart/ancestries?query=${encodeURIComponent(name)}&view=cards`
      );
      const card = page.getByRole("article", { name });
      await expect(card).toBeVisible();
      await expect(card.getByText("Invented glow")).toBeVisible();
      await expect(card.getByText("Invented second effect.")).toBeVisible();

      // --- Not a 5e page ----------------------------------------------------
      const fiveE = await page.goto("/dashboard/dnd5e/ancestries");
      expect(fiveE?.status()).toBe(404);

      // --- Edited, then deleted ---------------------------------------------
      await gotoRow(page, name);
      await rowFor(page, name)
        .getByRole("button", { name: messages.common.table.edit })
        .click();
      const dialog = page.getByRole("dialog");
      await dialog.getByLabel(messages.common.fields.name.label).fill(renamed);
      await dialog.getByRole("button", { name: t.form.editButton }).click();
      await expect(dialog).toHaveCount(0);
      await gotoRow(page, renamed);
      await expect(rowFor(page, renamed)).toBeVisible();

      await deleteRow(page, renamed);
    } finally {
      await deleteRow(page, renamed);
      await deleteRow(page, name);
    }
  });
});

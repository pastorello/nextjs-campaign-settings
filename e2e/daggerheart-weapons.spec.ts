import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import messages from "@/messages/it.json";

/**
 * SPEC-029 T2, T5: a Daggerheart weapon refused with half a feature, then
 * saved; read as a card (and scanned by axe); found by search under
 * Daggerheart alone; a 404 under 5e; deleted.
 * Everything it writes is invented (SPEC-018 §5), and removed in
 * `finally`.
 */
const ADMIN = "/dashboard/daggerheart/admin/weapons";
const t = messages.dhWeapons;
const dh = messages.daggerheart;

const rowFor = (page: Page, name: string) =>
  page.getByRole("row").filter({ hasText: name });

const deleteRow = async (page: Page, name: string) => {
  await page.goto(`${ADMIN}?query=${encodeURIComponent(name)}`);
  // Row buttons open client-side dialogs; a click before hydration is lost.
  await page.waitForLoadState("networkidle");
  const row = rowFor(page, name);
  if ((await row.count()) === 0) return;
  await row.getByRole("button", { name: messages.common.form.delete }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: messages.common.form.delete })
    .click();
  await expect(row).toHaveCount(0);
};

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Picks `option` in the select labelled `label`, now showing `current`. */
const choose = async (
  page: Page,
  label: string,
  current: string,
  option: string
) => {
  await page
    .getByRole("button", {
      name: new RegExp(`^${escape(label)}\\s*${escape(current)}$`),
    })
    .click();
  await page.getByRole("option", { name: option, exact: true }).click();
};

test.describe("Daggerheart weapons", () => {
  test("a weapon needs a whole feature, shows as a card, and is deleted", async ({
    page,
  }) => {
    const name = `E2E Arma ${Date.now()}`;

    try {
      await page.goto(`${ADMIN}/new`);
      await page.waitForLoadState("networkidle");
      await page.getByLabel(messages.common.fields.name.label).fill(name);
      await choose(page, t.fields.damageDie.label, dh.dice.d4, dh.dice.d8);
      await page
        .getByLabel(t.fields.damageBonus.label, { exact: true })
        .fill("2");
      await choose(
        page,
        t.fields.burden.label,
        dh.burdens.oneHanded,
        dh.burdens.twoHanded
      );
      await page
        .getByLabel(messages.dhEquipment.fields.featureName.label, {
          exact: true,
        })
        .fill("Invented reach");

      // A feature name without its text is refused (SPEC-029 §6).
      await page.getByRole("button", { name: t.form.createButton }).click();
      const summary = page
        .getByRole("alert")
        .filter({ hasText: messages.common.formErrors.title });
      await expect(summary).toContainText(
        messages.common.fieldErrors.featureNeedsBoth
      );
      await expect(page).toHaveURL(/\/admin\/weapons\/new/);

      await page
        .getByRole("textbox", {
          name: messages.dhEquipment.fields.featureText.label,
        })
        .click();
      await page.keyboard.type("Invented feature text.");
      await page.getByRole("button", { name: t.form.createButton }).click();
      await page.waitForURL(`**${ADMIN}`);

      // --- The card ---------------------------------------------------------
      await page.goto(
        `/dashboard/daggerheart/weapons?query=${encodeURIComponent(name)}&view=cards`
      );
      const card = page.getByRole("article", { name });
      await expect(card).toContainText("d8+2");
      await expect(card).toContainText(dh.burdens.twoHanded);
      await expect(card).toContainText("Invented reach");
      await page.waitForLoadState("networkidle");
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        axe.violations.map((v) => `${v.id} (${v.nodes.length} nodes)`),
        "axe violations on a weapon's card"
      ).toEqual([]);

      // --- Search finds it under daggerheart, not under dnd5e (T5) ----------
      await page.goto(
        `/dashboard/daggerheart/search?query=${encodeURIComponent(name)}`
      );
      await expect(page.getByRole("link", { name, exact: true })).toBeVisible();
      await page.goto(
        `/dashboard/dnd5e/search?query=${encodeURIComponent(name)}`
      );
      await expect(
        page.getByText(messages.search.page.noMatches.replace("{term}", name))
      ).toBeVisible();

      // --- Not a 5e page ----------------------------------------------------
      const fiveE = await page.goto("/dashboard/dnd5e/weapons");
      expect(fiveE?.status()).toBe(404);

      await deleteRow(page, name);
    } finally {
      await deleteRow(page, name);
    }
  });
});

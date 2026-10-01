import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import messages from "@/messages/it.json";

/**
 * SPEC-029 T3, T4: an armor refused with Major at Severe, then saved; a
 * piece of loot with a roll value; both read as cards (and scanned by
 * axe), neither found under 5e, both deleted. Everything it writes is
 * invented (SPEC-018 §5), and removed in `finally`.
 */
const ADMIN_ARMOR = "/dashboard/daggerheart/admin/armor";
const ADMIN_LOOT = "/dashboard/daggerheart/admin/loot";

const rowFor = (page: Page, name: string) =>
  page.getByRole("row").filter({ hasText: name });

const deleteRow = async (page: Page, listUrl: string, name: string) => {
  await page.goto(`${listUrl}?query=${encodeURIComponent(name)}`);
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

const fill = (page: Page, label: string, value: string) =>
  page.getByLabel(label, { exact: true }).fill(value);

const scan = async (page: Page, label: string) => {
  await page.waitForLoadState("networkidle");
  const axe = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .analyze();
  expect(
    axe.violations.map((v) => `${v.id} (${v.nodes.length} nodes)`),
    `axe violations on ${label}`
  ).toEqual([]);
};

test.describe("Daggerheart armor and loot", () => {
  test("an armor and a piece of loot, refused, saved, read and deleted", async ({
    page,
  }) => {
    test.setTimeout(90_000);
    const stamp = Date.now();
    const armor = `E2E Armatura ${stamp}`;
    const loot = `E2E Bottino ${stamp}`;

    try {
      // --- Armor: Major at Severe is refused ---------------------------------
      await page.goto(`${ADMIN_ARMOR}/new`);
      await page.waitForLoadState("networkidle");
      await fill(page, messages.common.fields.name.label, armor);
      await fill(page, messages.dhArmor.fields.major.label, "7");
      await fill(page, messages.dhArmor.fields.severe.label, "7");
      await fill(page, messages.dhArmor.fields.armorScore.label, "3");
      await page
        .getByRole("button", { name: messages.dhArmor.form.createButton })
        .click();
      await expect(
        page
          .getByRole("alert")
          .filter({ hasText: messages.common.formErrors.title })
      ).toContainText(messages.common.fieldErrors.majorBelowSevere);

      await fill(page, messages.dhArmor.fields.severe.label, "14");
      await page
        .getByRole("button", { name: messages.dhArmor.form.createButton })
        .click();
      await page.waitForURL(`**${ADMIN_ARMOR}`);

      await page.goto(
        `/dashboard/daggerheart/armor?query=${encodeURIComponent(armor)}&view=cards`
      );
      await expect(page.getByRole("article", { name: armor })).toContainText(
        "7/14"
      );
      await scan(page, "an armor's card");

      // --- Loot with a roll value ---------------------------------------------
      await page.goto(`${ADMIN_LOOT}/new`);
      await page.waitForLoadState("networkidle");
      await fill(page, messages.common.fields.name.label, loot);
      await fill(page, messages.dhLoot.fields.rollValue.label, "12");
      await page
        .getByRole("textbox", { name: messages.dhLoot.fields.effectText.label })
        .click();
      await page.keyboard.type("Invented effect.");
      await page
        .getByRole("button", { name: messages.dhLoot.form.createButton })
        .click();
      await page.waitForURL(`**${ADMIN_LOOT}`);

      await page.goto(
        `/dashboard/daggerheart/loot?query=${encodeURIComponent(loot)}&view=cards`
      );
      const card = page.getByRole("article", { name: loot });
      await expect(card).toContainText(
        messages.dhLoot.card.rollValue.replace("{value}", "12")
      );
      await expect(card).toContainText("Invented effect.");
      await scan(page, "a piece of loot's card");

      // --- Neither is a 5e page -----------------------------------------------
      expect((await page.goto("/dashboard/dnd5e/armor"))?.status()).toBe(404);
      expect((await page.goto("/dashboard/dnd5e/loot"))?.status()).toBe(404);

      await deleteRow(page, ADMIN_ARMOR, armor);
      await deleteRow(page, ADMIN_LOOT, loot);
    } finally {
      await deleteRow(page, ADMIN_ARMOR, armor);
      await deleteRow(page, ADMIN_LOOT, loot);
    }
  });
});

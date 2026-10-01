import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import messages from "@/messages/it.json";

/**
 * SPEC-028 T2: a Daggerheart adversary's stat block — refused as a horde
 * without a density and with a damage that does not parse, then saved; an
 * experience and a Fear feature added inline; read as a stat block (and
 * scanned by axe); a 404 under 5e; deleted. Everything it writes is
 * invented (SPEC-018 §5), and removed in `finally`.
 */
const ADMIN = "/dashboard/daggerheart/admin/adversaries";
const t = messages.dhAdversaries;
const errors = messages.common.fieldErrors;

const rowFor = (page: Page, name: string) =>
  page.getByRole("row").filter({ hasText: name });

const gotoRow = async (page: Page, name: string) => {
  await page.goto(`${ADMIN}?query=${encodeURIComponent(name)}`);
  // Row buttons open client-side dialogs; a click before hydration is lost.
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

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/**
 * Picks `option` in the listbox select labelled `label`, now showing
 * `current`. The button's name is the label and the value together, and
 * one label can begin another's ("Tipo", "Tipo di danno").
 */
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

const fill = (page: Page, label: string, value: string) =>
  page.getByLabel(label, { exact: true }).fill(value);

test.describe("Daggerheart adversaries", () => {
  test("a stat block is refused, saved, given rows inline, read and deleted", async ({
    page,
  }) => {
    const name = `E2E Avversario ${Date.now()}`;

    try {
      await page.goto(`${ADMIN}/new`);
      await page.waitForLoadState("networkidle");
      await fill(page, messages.common.fields.name.label, name);
      await choose(
        page,
        t.fields.adversaryType.label,
        messages.daggerheart.adversaryTypes.bruiser,
        messages.daggerheart.adversaryTypes.horde
      );
      await fill(page, messages.daggerheart.fields.difficulty.label, "12");
      await fill(page, t.fields.majorThreshold.label, "6");
      await fill(page, t.fields.severeThreshold.label, "11");
      await fill(page, t.fields.hp.label, "4");
      await fill(page, t.fields.stress.label, "2");
      await fill(page, t.fields.attackModifier.label, "1");
      await fill(page, t.fields.attackName.label, "Invented claws");
      await fill(page, t.fields.attackDamage.label, "2d7");

      // A horde with no density and an unparseable damage: refused, field
      // by field (SPEC-028 §5).
      await page.getByRole("button", { name: t.form.createButton }).click();
      const summary = page
        .getByRole("alert")
        .filter({ hasText: messages.common.formErrors.title });
      await expect(summary).toContainText(t.fields.attackDamage.label);
      await expect(page).toHaveURL(/\/admin\/adversaries\/new/);

      await fill(page, t.fields.attackDamage.label, "2d8+1");
      await page.getByRole("button", { name: t.form.createButton }).click();
      await expect(summary).toContainText(errors.hordeNeedsDensity);

      await fill(page, t.fields.hordeDensity.label, "3");
      await page.getByRole("button", { name: t.form.createButton }).click();
      await page.waitForURL(`**${ADMIN}`);

      // --- An experience and a Fear feature, inline in the edit dialog -----
      await gotoRow(page, name);
      await rowFor(page, name)
        .getByRole("button", { name: messages.common.table.edit })
        .click();
      const dialog = page.getByRole("dialog");

      await dialog
        .getByRole("button", { name: t.experiences.addButton })
        .click();
      await dialog
        .getByLabel(messages.dhStatBlock.fields.experienceName.label, {
          exact: true,
        })
        .fill("Invented alleys");
      await dialog
        .getByLabel(messages.dhStatBlock.fields.bonus.label, { exact: true })
        .fill("2");
      await dialog
        .getByRole("button", { name: t.experiences.saveButton })
        .click();
      await expect(dialog.getByText("Invented alleys")).toBeVisible();

      await dialog.getByRole("button", { name: t.features.addButton }).click();
      await dialog
        .getByRole("checkbox", { name: messages.dhStatBlock.fields.fear.label })
        .click();
      await dialog
        .getByLabel(messages.dhFeature.fields.name.label, { exact: true })
        .fill("Invented swarm");
      await dialog
        .getByRole("textbox", { name: messages.dhFeature.fields.text.label })
        .click();
      await page.keyboard.type("Invented feature text.");
      await dialog.getByRole("button", { name: t.features.saveButton }).click();
      await expect(dialog.getByText("Invented swarm")).toBeVisible();

      // --- The stat block ---------------------------------------------------
      await page.goto(
        `/dashboard/daggerheart/adversaries?query=${encodeURIComponent(name)}&view=cards`
      );
      const block = page.getByRole("article", { name });
      await expect(block).toContainText(
        t.statBlock.hordeDensity.replace("{count}", "3")
      );
      await expect(block).toContainText("6/11");
      await expect(block).toContainText("2d8+1");
      await expect(block).toContainText("Invented alleys +2");
      await expect(block.getByText(t.statBlock.fear)).toBeVisible();
      await page.waitForLoadState("networkidle");
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        axe.violations.map((v) => `${v.id} (${v.nodes.length} nodes)`),
        "axe violations on an adversary's stat block"
      ).toEqual([]);

      // --- Not a 5e page ----------------------------------------------------
      const fiveE = await page.goto("/dashboard/dnd5e/adversaries");
      expect(fiveE?.status()).toBe(404);

      await deleteRow(page, name);
    } finally {
      await deleteRow(page, name);
    }
  });
});

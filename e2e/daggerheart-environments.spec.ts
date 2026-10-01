import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import messages from "@/messages/it.json";

/**
 * SPEC-028 T3: a Daggerheart environment that brings an adversary and
 * describes a place. Its stat block links the adversary to its own block
 * and passes axe; a feature with questions is added inline; the
 * adversary's delete is refused while the environment lists it, and goes
 * once the environment is gone. Everything it writes is invented
 * (SPEC-018 §5), and removed in `finally`.
 */
const ADMIN = "/dashboard/daggerheart/admin/environments";
const ADMIN_ADVERSARIES = "/dashboard/daggerheart/admin/adversaries";
const t = messages.dhEnvironments;
const adversaries = messages.dhAdversaries;

const rowFor = (page: Page, name: string) =>
  page.getByRole("row").filter({ hasText: name });

const gotoRow = async (page: Page, listUrl: string, name: string) => {
  await page.goto(`${listUrl}?query=${encodeURIComponent(name)}`);
  // Row buttons open client-side dialogs; a click before hydration is lost.
  await page.waitForLoadState("networkidle");
};

const deleteRow = async (page: Page, listUrl: string, name: string) => {
  await gotoRow(page, listUrl, name);
  const row = rowFor(page, name);
  if ((await row.count()) === 0) return;
  await row.getByRole("button", { name: messages.common.form.delete }).click();
  const deleted = page.waitForResponse(
    (response) =>
      response.url().includes("/api/") &&
      response.request().method() === "DELETE"
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: messages.common.form.delete })
    .click();
  await deleted;
};

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Opens the select labelled `label`, showing `current`, and picks `option`. */
const choose = async (
  page: Page,
  label: string,
  current: string,
  option?: string
) => {
  await page
    .getByRole("button", {
      name: new RegExp(`^${escape(label)}\\s*${escape(current)}`),
    })
    .click();
  const choice = option
    ? page.getByRole("option", { name: option, exact: true })
    : page.getByRole("option").first();
  const text = (await choice.innerText()).trim();
  await choice.click();
  await page.keyboard.press("Escape");
  return text;
};

const fill = (page: Page, label: string, value: string) =>
  page.getByLabel(label, { exact: true }).fill(value);

test.describe("Daggerheart environments", () => {
  test("an environment links an adversary and a place, and holds the adversary", async ({
    page,
  }) => {
    // Two records, an inline feature and two refused-then-allowed deletes:
    // well past the default 30 s on a cold dev server.
    test.setTimeout(120_000);
    const stamp = Date.now();
    const adversary = `E2E Gregario ${stamp}`;
    const environment = `E2E Ambiente ${stamp}`;

    try {
      // --- A minion to bring: no thresholds needed ---------------------------
      await page.goto(`${ADMIN_ADVERSARIES}/new`);
      await page.waitForLoadState("networkidle");
      await fill(page, messages.common.fields.name.label, adversary);
      await choose(
        page,
        adversaries.fields.adversaryType.label,
        messages.daggerheart.adversaryTypes.bruiser,
        messages.daggerheart.adversaryTypes.minion
      );
      await fill(page, adversaries.fields.attackName.label, "Invented jab");
      await fill(page, adversaries.fields.attackDamage.label, "3");
      await page
        .getByRole("button", { name: adversaries.form.createButton })
        .click();
      await page.waitForURL(`**${ADMIN_ADVERSARIES}`);

      // --- The environment ---------------------------------------------------
      await page.goto(`${ADMIN}/new`);
      await page.waitForLoadState("networkidle");
      await fill(page, messages.common.fields.name.label, environment);
      await fill(page, messages.daggerheart.fields.difficulty.label, "12");
      await fill(page, t.fields.impulses.label, "Invented, restless");
      await fill(page, t.fields.otherAdversaries.label, "Invented crowds");
      await choose(page, t.fields.adversaryIds.label, "", adversary);
      const place = await choose(page, t.fields.placeIds.label, "");
      await page.getByRole("button", { name: t.form.createButton }).click();
      await page.waitForURL(`**${ADMIN}`);

      // --- A feature with questions, inline ----------------------------------
      await gotoRow(page, ADMIN, environment);
      await rowFor(page, environment)
        .getByRole("button", { name: messages.common.table.edit })
        .click();
      const dialog = page.getByRole("dialog");
      await dialog.getByRole("button", { name: t.features.addButton }).click();
      await dialog
        .getByLabel(messages.dhFeature.fields.name.label, { exact: true })
        .fill("Invented draft");
      await dialog
        .getByRole("textbox", { name: messages.dhFeature.fields.text.label })
        .click();
      await page.keyboard.type("Invented feature text.");
      await dialog
        .getByRole("textbox", {
          name: messages.dhStatBlock.fields.questions.label,
        })
        .click();
      await page.keyboard.type("Invented question?");
      await dialog.getByRole("button", { name: t.features.saveButton }).click();
      await expect(dialog.getByText("Invented question?")).toBeVisible();

      // --- The stat block, and its link to the adversary's -------------------
      await page.goto(
        `/dashboard/daggerheart/environments?query=${encodeURIComponent(environment)}&view=cards`
      );
      const block = page.getByRole("article", { name: environment });
      await expect(block).toContainText("Invented, restless");
      await expect(block).toContainText("Invented crowds");
      await expect(block.getByRole("link", { name: place })).toBeVisible();
      await page.waitForLoadState("networkidle");
      const axe = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .analyze();
      expect(
        axe.violations.map((v) => `${v.id} (${v.nodes.length} nodes)`),
        "axe violations on an environment's stat block"
      ).toEqual([]);
      await block.getByRole("link", { name: adversary }).click();
      await expect(
        page.getByRole("article", { name: adversary })
      ).toBeVisible();

      // --- The listed adversary's delete is refused --------------------------
      await deleteRow(page, ADMIN_ADVERSARIES, adversary);
      await expect(
        page.getByText(
          messages.common.fieldErrors.adversaryInEnvironments.replace(
            "{count, plural, one {# ambiente elenca} other {# ambienti elencano}}",
            "1 ambiente elenca"
          )
        )
      ).toBeVisible();
      await gotoRow(page, ADMIN_ADVERSARIES, adversary);
      await expect(rowFor(page, adversary)).toBeVisible();

      // --- Without the environment, it goes ----------------------------------
      await deleteRow(page, ADMIN, environment);
      await deleteRow(page, ADMIN_ADVERSARIES, adversary);
      await gotoRow(page, ADMIN_ADVERSARIES, adversary);
      await expect(rowFor(page, adversary)).toHaveCount(0);

      // --- Not a 5e page ----------------------------------------------------
      const fiveE = await page.goto("/dashboard/dnd5e/environments");
      expect(fiveE?.status()).toBe(404);
    } finally {
      await deleteRow(page, ADMIN, environment);
      await deleteRow(page, ADMIN_ADVERSARIES, adversary);
    }
  });
});

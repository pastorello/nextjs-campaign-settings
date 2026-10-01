import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import messages from "@/messages/it.json";

import { ensureCampaign } from "./helpers/ensureCampaign";

/**
 * SPEC-030 T5: a Daggerheart adventure, end to end. An invented Bruiser
 * prices a fight scene in Battle Points against the party's budget plus a
 * ticked adjustment; a lower tier than the adventure's is suggested, not
 * ticked; a loot row's gold reads in bags and handfuls in the budget
 * panel; a played milestone is counted. The page is scanned by axe with
 * its forms open. Everything it writes is invented (SPEC-018 §5) and
 * removed in `finally`; the campaign stays, as it has no delete.
 */
const ADVERSARIES = "/dashboard/daggerheart/admin/adversaries";
const CAMPAIGN = "/dashboard/daggerheart/campaign";
const adversaryFields = messages.dhAdversaries.fields;

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

const fill = (page: Page, label: string, value: string) =>
  page.getByLabel(label, { exact: true }).fill(value);

/** The scene's "Punti Battaglia: spent / budget", whatever the budget. */
const battlePoints = (spent: number) =>
  new RegExp(
    `^${escape(messages.scene.battlePoints.summary)
      .replace(escape("{spent}"), String(spent))
      .replace(escape("{budget}"), "\\d+")}`
  );

/** Deletes the row of `name` from a list, if it is there. */
const deleteRow = async (page: Page, url: string, name: string) => {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  const row = page.getByRole("row").filter({ hasText: name });
  if ((await row.count()) === 0) return;
  await row.getByRole("button", { name: messages.common.form.delete }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: messages.common.form.delete })
    .click();
  await expect(row).toHaveCount(0);
};

test("a Daggerheart fight is budgeted in Battle Points and its loot in gold", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const stamp = Date.now();
  const adversary = `E2E Bruto ${stamp}`;
  const adventure = `E2E Avventura DH ${stamp}`;

  try {
    // --- An invented tier-1 Bruiser: 4 Battle Points -------------------
    await page.goto(`${ADVERSARIES}/new`);
    await page.waitForLoadState("networkidle");
    await fill(page, messages.common.fields.name.label, adversary);
    await fill(page, messages.daggerheart.fields.difficulty.label, "12");
    await fill(page, adversaryFields.majorThreshold.label, "6");
    await fill(page, adversaryFields.severeThreshold.label, "11");
    await fill(page, adversaryFields.hp.label, "5");
    await fill(page, adversaryFields.stress.label, "2");
    await fill(page, adversaryFields.attackModifier.label, "1");
    await fill(page, adversaryFields.attackName.label, "Invented fists");
    await fill(page, adversaryFields.attackDamage.label, "1d8+2");
    await page
      .getByRole("button", { name: messages.dhAdversaries.form.createButton })
      .click();
    await page.waitForURL(`**${ADVERSARIES}`);

    // --- An adventure at level 5: tier 3, above the Bruiser's ----------
    await ensureCampaign(page, "daggerheart");
    await page.goto(CAMPAIGN);
    await page.waitForLoadState("networkidle");
    await page
      .getByRole("button", { name: messages.adventure.ladder.addButton })
      .click();
    const adventureForm = page.locator("form");
    await fill(page, messages.adventure.fields.targetLevel.label, "5");
    await adventureForm
      .getByLabel(messages.adventure.fields.title.label, { exact: true })
      .fill(adventure);
    await adventureForm
      .getByRole("button", { name: messages.adventure.form.createButton })
      .click();
    await page.getByRole("link", { name: adventure }).click();

    // --- A fight scene, a milestone, a harder fight (+2) ---------------
    const addScene = page.getByRole("button", {
      name: messages.scene.list.addButton,
    });
    await expect(addScene).toBeVisible();
    await page.waitForLoadState("networkidle");
    await addScene.click();
    const sceneForm = page.locator("form");
    await sceneForm
      .getByLabel(messages.scene.fields.title.label, { exact: true })
      .fill("Lo scontro al guado inventato");
    await sceneForm
      .getByRole("checkbox", { name: messages.scene.fields.milestone.label })
      .click();
    await sceneForm
      .getByRole("checkbox", {
        name: messages.daggerheart.battleAdjustments.harderOrLonger,
      })
      .click();
    await sceneForm
      .getByRole("button", { name: messages.scene.form.createButton })
      .click();
    await expect(page.getByText(battlePoints(0))).toBeVisible();
    await expect(
      page.getByText(messages.daggerheart.battleAdjustments.harderOrLonger)
    ).toBeVisible();

    // --- The Bruiser on a creature row, named after it -----------------
    await page
      .getByRole("button", { name: messages.sceneCreature.list.addButton })
      .click();
    const creatureForm = page.locator("form");
    await creatureForm
      .getByRole("button", {
        name: new RegExp(
          `^${escape(messages.sceneCreature.fields.dhAdversaryId.label)}\\s*${escape(messages.sceneCreature.fields.dhAdversaryId.noneOption)}$`
        ),
      })
      .click();
    await page.getByRole("option", { name: adversary, exact: true }).click();
    await expect(
      creatureForm.getByLabel(messages.sceneCreature.fields.name.label, {
        exact: true,
      })
    ).toHaveValue(adversary);
    await creatureForm
      .getByRole("button", { name: messages.sceneCreature.form.createButton })
      .click();

    await expect(
      page.getByText(`${messages.sceneCreature.list.battlePoints}: 4`, {
        exact: true,
      })
    ).toBeVisible();
    await expect(page.getByText(battlePoints(4))).toBeVisible();
    await expect(
      page.getByText(messages.scene.battlePoints.lowerTierSuggestion)
    ).toBeVisible();

    // --- Twelve handfuls of gold: a bag and two handfuls ---------------
    await page
      .getByRole("button", { name: messages.loot.list.addButton })
      .click();
    const lootForm = page.locator("form");
    await lootForm
      .getByLabel(messages.loot.fields.description.label, { exact: true })
      .fill("Una borsa inventata");
    await lootForm
      .getByLabel(messages.loot.fields.gold.label, { exact: true })
      .fill("12");
    await lootForm
      .getByRole("button", { name: messages.loot.form.createButton })
      .click();

    const gold = "1 borsa, 2 manciate";
    await expect(page.getByRole("listitem").getByText(gold)).toBeVisible();
    await expect(
      page.getByRole("row").filter({ hasText: messages.budget.categories.gold })
    ).toContainText(gold);

    // --- The milestone, played ------------------------------------------
    await page
      .getByRole("checkbox", { name: messages.scene.checkOff.played })
      .click();
    await expect(
      page.getByText(
        `${messages.budget.milestones.title}: ${messages.budget.milestones.planned} 1 · ${messages.budget.milestones.reached} 1`
      )
    ).toBeVisible();

    // --- Axe, with the scene and creature forms open --------------------
    await addScene.click();
    await page
      .getByRole("button", { name: messages.sceneCreature.list.addButton })
      .click();
    await expect(page).toHaveTitle(/\S/);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map(
        (violation) => `${violation.id} (${violation.nodes.length} nodes)`
      )
    ).toEqual([]);
  } finally {
    await deleteRow(page, CAMPAIGN, adventure);
    await deleteRow(page, `${ADVERSARIES}?query=${adversary}`, adversary);
  }
});

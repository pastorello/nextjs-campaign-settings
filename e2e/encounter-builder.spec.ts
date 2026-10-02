import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import messages from "@/messages/it.json";

import { ensureCampaign } from "./helpers/ensureCampaign";

/**
 * SPEC-031 T5: a 5e fight, end to end. An invented creature's challenge
 * rating fills its XP and its statistics link opens in a new tab; the
 * fight's band follows the page's number of characters, which survives a
 * reload; counting the creature fewer times, or out, changes the band and
 * nothing stored; each Reset puts it back. The page is scanned by axe with
 * the count controls showing. Everything it writes is invented (SPEC-018
 * §5) and removed in `finally`; the campaign stays, as it has no delete.
 */
const CAMPAIGN = "/dashboard/dnd5e/campaign";
const encounter = messages.scene.encounter;
const adjust = messages.sceneCreature.adjust;

const escape = (text: string) => text.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** "Difficoltà: <band>" for one of the four bands. */
const difficulty = (band: keyof typeof encounter.bands) =>
  encounter.difficulty.replace("{band}", encounter.bands[band]);

/** A Headless UI listbox's button: its label, then its current value. */
const listbox = (page: Page, label: string, value: string) =>
  page.getByRole("button", {
    name: new RegExp(`^${escape(label)}\\s*${escape(value)}$`),
  });

const choose = async (
  page: Page,
  label: string,
  current: string,
  next: string
) => {
  await listbox(page, label, current).click();
  await page.getByRole("option", { name: next, exact: true }).click();
  await expect(listbox(page, label, next)).toBeVisible();
};

const partySize = messages.adventure.partySize.label;

/** Deletes the adventure's row from the campaign page, if it is there. */
const deleteAdventure = async (page: Page, title: string) => {
  await page.goto(CAMPAIGN);
  await page.waitForLoadState("networkidle");
  const row = page.getByRole("row").filter({ hasText: title });
  if ((await row.count()) === 0) return;
  await row.getByRole("button", { name: messages.common.form.delete }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: messages.common.form.delete })
    .click();
  await expect(row).toHaveCount(0);
};

test("a 5e fight's difficulty follows the party and the counted creatures", async ({
  page,
}) => {
  test.setTimeout(180_000);
  const adventure = `E2E Avventura 5e ${Date.now()}`;
  const creature = "Lupo inventato";

  try {
    // --- An adventure at level 3 ---------------------------------------
    await ensureCampaign(page, "dnd5e");
    await page.goto(CAMPAIGN);
    await page.waitForLoadState("networkidle");
    await page
      .getByRole("button", { name: messages.adventure.ladder.addButton })
      .click();
    const adventureForm = page.locator("form");
    await adventureForm
      .getByLabel(messages.adventure.fields.targetLevel.label, { exact: true })
      .fill("3");
    await adventureForm
      .getByLabel(messages.adventure.fields.title.label, { exact: true })
      .fill(adventure);
    await adventureForm
      .getByRole("button", { name: messages.adventure.form.createButton })
      .click();
    await page.getByRole("link", { name: adventure }).click();

    // --- A fight scene: no creatures yet, the budgets and no band ------
    const addScene = page.getByRole("button", {
      name: messages.scene.list.addButton,
    });
    await expect(addScene).toBeVisible();
    await page.waitForLoadState("networkidle");
    await addScene.click();
    const sceneForm = page.locator("form");
    await sceneForm
      .getByLabel(messages.scene.fields.title.label, { exact: true })
      .fill("L'imboscata inventata");
    await sceneForm
      .getByRole("button", { name: messages.scene.form.createButton })
      .click();
    await expect(page.getByText(encounter.noBand)).toBeVisible();

    // --- Four CR 1 creatures: the CR fills 200 XP each -----------------
    await page
      .getByRole("button", { name: messages.sceneCreature.list.addButton })
      .click();
    const creatureForm = page.locator("form");
    const field = (label: string) =>
      creatureForm.getByLabel(label, { exact: true });
    const fields = messages.sceneCreature.fields;
    await field(fields.name.label).fill(creature);
    await choose(
      page,
      fields.challengeRating.label,
      fields.challengeRating.noneOption,
      "1"
    );
    await expect(field(fields.xpEach.label)).toHaveValue("200");
    await field(fields.quantity.label).fill("4");
    await field(fields.statsUrl.label).fill(
      "https://example.com/bestiario/lupo-inventato"
    );
    await creatureForm
      .getByRole("button", { name: messages.sceneCreature.form.createButton })
      .click();

    const stats = page.getByRole("link", {
      name: messages.sceneCreature.list.statsLinkLabel.replace(
        "{name}",
        creature
      ),
    });
    await expect(stats).toHaveAttribute(
      "href",
      "https://example.com/bestiario/lupo-inventato"
    );
    await expect(stats).toHaveAttribute("target", "_blank");
    await expect(
      page.getByText(`${messages.sceneCreature.list.challengeRating} 1`, {
        exact: true,
      })
    ).toBeVisible();

    // --- 800 XP: Media for four characters, Difficile for two ----------
    await expect(page.getByText(difficulty("moderate"))).toBeVisible();
    await choose(page, partySize, "4", "2");
    await expect(page.getByText(difficulty("high"))).toBeVisible();

    // The party size is the browser's, and survives a reload.
    await page.reload();
    await page.waitForLoadState("networkidle");
    await expect(listbox(page, partySize, "2")).toBeVisible();
    await expect(page.getByText(difficulty("high"))).toBeVisible();

    // --- Counted twice instead of four times: 400 XP, Media ------------
    const fewer = page.getByRole("button", {
      name: adjust.decreaseLabel.replace("{name}", creature),
    });
    await fewer.click();
    await fewer.click();
    await expect(
      page.getByText(
        adjust.counted.replace("{counted}", "2").replace("{stored}", "4")
      )
    ).toBeVisible();
    await expect(page.getByText(difficulty("moderate"))).toBeVisible();
    // The row still says what is stored.
    await expect(page.getByText("×4", { exact: true })).toBeVisible();

    // --- Counted out: nothing priced, no band ---------------------------
    await page
      .getByRole("button", {
        name: adjust.excludeLabel.replace("{name}", creature),
      })
      .click();
    await expect(page.getByText(adjust.excluded)).toBeVisible();
    await expect(page.getByText(encounter.noBand)).toBeVisible();

    // --- Axe, with the count controls and the party select showing -----
    await expect(page).toHaveTitle(/\S/);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(
      results.violations.map(
        (violation) => `${violation.id} (${violation.nodes.length} nodes)`
      )
    ).toEqual([]);

    // --- The scene's Reset, then the party's -----------------------------
    await page
      .getByRole("button", {
        name: encounter.resetLabel.replace("{title}", "L'imboscata inventata"),
      })
      .click();
    await expect(page.getByText(adjust.excluded)).toBeHidden();
    await expect(page.getByText(difficulty("high"))).toBeVisible();

    await page
      .getByRole("button", { name: messages.adventure.partySize.reset })
      .click();
    await expect(listbox(page, partySize, "4")).toBeVisible();
    await expect(page.getByText(difficulty("moderate"))).toBeVisible();
  } finally {
    await deleteAdventure(page, adventure);
  }
});

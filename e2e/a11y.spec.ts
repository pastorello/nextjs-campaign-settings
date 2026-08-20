import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import messages from "@/messages/it.json";

/**
 * Automated accessibility scan (TD-15).
 *
 * **This asserts zero violations now, not an allowlist.** When TD-24 wrote this
 * spec the app had never had an accessibility pass, so each page carried the
 * rule ids it was failing and the test only caught *new* kinds. Those are all
 * fixed, so the list is gone: any violation on any of these pages fails the
 * suite.
 *
 * What was in that list, and where it went:
 *
 * - `link-name` ×4 on every page — the sidebar's icon-only "manage" links, and
 *   later the pagination arrows. Both carry an `aria-label`.
 * - `button-name` ×3 on the admin lists — the icon-only sort controls, which
 *   now name the column they order by.
 * - `color-contrast` ×18–19 — white on `violet-500` measured 4.4:1 against the
 *   4.5:1 that 14px text needs, and white on `rose-500` measured 3.75:1. The
 *   primary and danger variants moved one step darker.
 * - `aria-toggle-field-name` — already gone by the time this pass started; it
 *   was a stale entry, which is exactly the failure mode an allowlist has.
 *
 * axe is not the whole story: it does not check that focus is *visible*, so
 * that has its own test below.
 */
const PAGES = [
  "/dashboard",
  "/dashboard/spells",
  "/dashboard/npc",
  "/dashboard/deities",
  "/dashboard/magicitems",
  "/dashboard/admin/spells",
  "/dashboard/admin/npc",
  "/dashboard/admin/deities",
  "/dashboard/admin/magicitems",
  "/dashboard/admin/spells/new",
  "/dashboard/admin/npc/new",
];

for (const path of PAGES) {
  test(`${path} has no accessibility violations`, async ({ page }) => {
    await page.goto(path);

    // Scan a settled page. Without this the result depends on how much has
    // streamed in: an early run missed `button-name` entirely because the sort
    // controls had not rendered yet, and CI then failed on a violation that had
    // been there all along.
    await page.waitForLoadState("networkidle");

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const summary = results.violations.map(
      (violation) => `${violation.id} (${violation.nodes.length} nodes)`
    );

    expect(summary, `axe violations on ${path}`).toEqual([]);
  });
}

/**
 * SPEC-013 T10: the campaign and adventure pages. These two cannot join
 * `PAGES` above — what they render depends on data (the campaign page is a
 * creation form until the one campaign exists; the adventure page needs a
 * real adventure id in the URL) — so this test builds its fixtures first,
 * idempotently, the same way `world.setup.ts` does for the root place: the
 * campaign has no delete action (T6, deliberate), so the first run creates
 * "E2E Campaign" and every later run finds it already there.
 *
 * Each page is scanned with its add-forms open, so the scan covers the
 * bespoke forms (ADR-0011) as well as the lists: the ladder plus
 * `AdventureForm` on the campaign page; `BudgetPanel`, a scene row with its
 * check-off control, plus `SceneForm`/`SceneCreatureForm`/`LootForm` on the
 * adventure page. Not covered: the edit variants of the forms (same
 * components, same inputs, different initial values) and rows in the
 * creature/loot lists (same row controls the scene list's scan covers).
 */
test("campaign and adventure pages have no accessibility violations", async ({
  page,
}) => {
  await page.goto("/dashboard/campaign");
  await page.waitForLoadState("networkidle");

  const scan = async (label: string) => {
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    const summary = results.violations.map(
      (violation) => `${violation.id} (${violation.nodes.length} nodes)`
    );
    expect(summary, `axe violations on ${label}`).toEqual([]);
  };

  const createCampaignButton = page.getByRole("button", {
    name: messages.campaign.form.createButton,
  });
  if (await createCampaignButton.isVisible().catch(() => false)) {
    await page
      .getByLabel(messages.campaign.fields.title.label)
      .fill("E2E Campaign");
    await createCampaignButton.click();
  }

  const addAdventureButton = page.getByRole("button", {
    name: messages.adventure.ladder.addButton,
  });
  await expect(addAdventureButton).toBeVisible();

  const adventureLink = page.getByRole("link", { name: "E2E Adventure" });
  if (!(await adventureLink.isVisible().catch(() => false))) {
    await addAdventureButton.click();
    const form = page.locator("form");
    await form
      .getByLabel(messages.adventure.fields.title.label)
      .fill("E2E Adventure");
    await form
      .getByRole("button", { name: messages.adventure.form.createButton })
      .click();
    await expect(adventureLink).toBeVisible();
  }

  // Campaign page: header, ladder with a row, and the add-adventure form.
  await addAdventureButton.click();
  await scan("/dashboard/campaign");

  await adventureLink.click();
  await expect(
    page.getByRole("button", { name: messages.scene.list.addButton })
  ).toBeVisible();
  await page.waitForLoadState("networkidle");

  const sceneTitle = page.getByText("E2E Scene");
  if (!(await sceneTitle.isVisible().catch(() => false))) {
    await page
      .getByRole("button", { name: messages.scene.list.addButton })
      .click();
    const form = page.locator("form");
    await form.getByLabel(messages.scene.fields.title.label).fill("E2E Scene");
    await form
      .getByRole("button", { name: messages.scene.form.createButton })
      .click();
    await expect(sceneTitle).toBeVisible();
  }

  // Adventure page: budget panel, a scene row with its check-off control,
  // and all three add-forms open at once.
  await page
    .getByRole("button", { name: messages.scene.list.addButton })
    .click();
  await page
    .getByRole("button", { name: messages.sceneCreature.list.addButton })
    .click();
  await page
    .getByRole("button", { name: messages.loot.list.addButton })
    .click();
  await scan("/dashboard/campaign/[adventureId]");
});

// The three row/toolbar buttons this test tabs through to find, read from the
// catalogue rather than hardcoded — "Delete" here used to be a dead branch
// that never matched the actual Italian button text ("Elimina").
const FOCUSABLE_BUTTON_TEXT = new RegExp(
  [
    messages.common.table.edit,
    messages.common.form.delete,
    messages.common.filters.reset,
  ].join("|")
);

test("a keyboard user can see where the focus is", async ({ page }) => {
  // WCAG 2.4.7, which axe cannot check. It also cannot be checked by calling
  // `.focus()`: programmatic focus does not match `:focus-visible`, and the
  // computed style then reports `outline-style: none` on a perfectly fine
  // button. Only a real keypress answers the question.
  await page.goto("/dashboard/admin/spells");
  await page.waitForLoadState("networkidle");

  for (let step = 0; step < 80; step += 1) {
    await page.keyboard.press("Tab");

    const focused = await page.evaluate((pattern) => {
      const element = document.activeElement;

      if (!(element instanceof HTMLButtonElement)) return null;
      if (!new RegExp(pattern).test(element.innerText)) return null;

      const style = getComputedStyle(element);

      return {
        text: element.innerText.trim(),
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
      };
    }, FOCUSABLE_BUTTON_TEXT.source);

    if (focused) {
      expect(focused.outlineStyle).not.toBe("none");
      expect(parseFloat(focused.outlineWidth)).toBeGreaterThanOrEqual(2);
      return;
    }
  }

  throw new Error("Tab never reached one of the app's own buttons");
});

/**
 * SPEC-015 T8 (§8): axe at zero on the grid configuration panel. The
 * geography page as a whole is not in `PAGES` above — the Leaflet canvas
 * is its own accessibility story — so the scan is scoped to the open
 * dialog, which is exactly what the criterion names. The panel's
 * keyboard-completability has its own unit test (T5); this covers the
 * rendered dialog: labels, names, contrast.
 */
test("the map grid configuration panel has no accessibility violations", async ({
  page,
}) => {
  await page.goto("/dashboard/geography");
  await expect(page.locator(".leaflet-container")).toBeVisible();

  await page
    .getByRole("button", { name: messages.geography.mapOptions.trigger })
    .click();
  await page
    .getByRole("button", { name: messages.geography.gridConfig.trigger })
    .click();

  // The Dialog root itself is a zero-height `relative` wrapper (its panel
  // is `fixed`-positioned), which Playwright reports as hidden — so the
  // wait anchors on the panel's visible title instead.
  await expect(
    page.getByText(messages.geography.gridConfig.title)
  ).toBeVisible();

  // Scan a settled panel: it opens through a framer-motion fade
  // (opacity 0 → 1), and a scan that races the animation reads the text
  // against the backdrop *through* the still-translucent panel, flagging
  // every node in it — nondeterministically, depending on where the fade
  // had got to. Same lesson as the networkidle wait above.
  await page.waitForFunction(() => {
    const panel = document.querySelector('[role="dialog"] .bg-white');
    return panel !== null && getComputedStyle(panel).opacity === "1";
  });

  const results = await new AxeBuilder({ page })
    .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
    .include('[role="dialog"]')
    .analyze();

  const summary = results.violations.map(
    (violation) => `${violation.id} (${violation.nodes.length} nodes)`
  );

  expect(summary, "axe violations on the grid configuration panel").toEqual([]);
});

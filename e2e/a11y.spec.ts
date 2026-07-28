import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

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
  "/dashboard/png",
  "/dashboard/deities",
  "/dashboard/magicitems",
  "/dashboard/admin/spells",
  "/dashboard/admin/png",
  "/dashboard/admin/deities",
  "/dashboard/admin/magicitems",
  "/dashboard/admin/spells/new",
  "/dashboard/admin/png/new",
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

test("a keyboard user can see where the focus is", async ({ page }) => {
  // WCAG 2.4.7, which axe cannot check. It also cannot be checked by calling
  // `.focus()`: programmatic focus does not match `:focus-visible`, and the
  // computed style then reports `outline-style: none` on a perfectly fine
  // button. Only a real keypress answers the question.
  await page.goto("/dashboard/admin/spells");
  await page.waitForLoadState("networkidle");

  for (let step = 0; step < 80; step += 1) {
    await page.keyboard.press("Tab");

    const focused = await page.evaluate(() => {
      const element = document.activeElement;

      if (!(element instanceof HTMLButtonElement)) return null;
      if (!/Modifica|Delete|Reset/.test(element.innerText)) return null;

      const style = getComputedStyle(element);

      return {
        text: element.innerText.trim(),
        outlineStyle: style.outlineStyle,
        outlineWidth: style.outlineWidth,
      };
    });

    if (focused) {
      expect(focused.outlineStyle).not.toBe("none");
      expect(parseFloat(focused.outlineWidth)).toBeGreaterThanOrEqual(2);
      return;
    }
  }

  throw new Error("Tab never reached one of the app's own buttons");
});

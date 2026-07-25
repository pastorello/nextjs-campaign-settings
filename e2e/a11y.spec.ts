import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

/**
 * Automated accessibility scan over the main pages — the static half of TD-15.
 * axe catches contrast, missing names and ARIA misuse; it does not replace the
 * manual keyboard pass that item also calls for.
 *
 * **This asserts no *new kind* of violation, not zero violations.** The app has
 * never had an accessibility pass, so a zero-violation gate would be red on
 * arrival — the same failure mode TD-05 avoided with its lint severity policy.
 * Each page lists the rule ids failing today; anything outside that list fails
 * the test immediately, and shrinking a list is how progress gets locked in.
 *
 * Measured 2026-07-25. What each known id actually is:
 *
 * - `link-name` (4 nodes, every page) — the pencil "edit" links in the sidebar
 *   are icon-only with no accessible name, so a screen reader announces four
 *   unlabelled links in the main navigation. The worst of the three.
 * - `color-contrast` — list page text below the 4.5:1 ratio.
 * - `aria-toggle-field-name` — the "Rituale" checkbox on the spell form.
 */
const PAGES: { path: string; name: string; known: string[] }[] = [
  { path: "/dashboard", name: "overview", known: ["link-name"] },
  {
    path: "/dashboard/spells",
    name: "spells list",
    known: ["link-name", "color-contrast"],
  },
  {
    path: "/dashboard/admin/spells",
    name: "spells admin",
    known: ["link-name", "color-contrast"],
  },
  {
    path: "/dashboard/admin/spells/new",
    name: "spell form",
    known: ["link-name", "aria-toggle-field-name"],
  },
];

for (const { path, name, known } of PAGES) {
  test(`${name} has no accessibility violations beyond the known set`, async ({
    page,
  }) => {
    await page.goto(path);

    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();

    const found = results.violations.map((violation) => violation.id).sort();
    const unexpected = found.filter((id) => !known.includes(id));

    expect(
      unexpected,
      `new axe violations on ${path}. All found: ${found.join(", ") || "none"}`
    ).toEqual([]);
  });
}

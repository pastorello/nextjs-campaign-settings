import { test, expect, type Page } from "@playwright/test";

/**
 * Pagination — deliberately narrower than docs/TESTING.md §E2E specifies, and
 * the reason is worth stating rather than hiding.
 *
 * That plan says "navigate pages, verify the count matches the rows".
 * Multi-page navigation cannot be exercised against the seeded database:
 * DEFAULT_ITEMS_PER_PAGE is 30 (app/lib/config/constants.ts) and the seed
 * inserts 4–5 records per domain, so every list is exactly one page. Writing a
 * page-2 assertion would mean either creating 30+ records through the UI on
 * every run, or an E2E-only fixture inserting them straight through Prisma —
 * neither of which belongs in TD-24's scope.
 *
 * What IS asserted is the half carrying the real risk: the count in the header
 * agrees with the rows rendered. That is the UI-level regression test for
 * TD-12, where rows and count come from two separately built queries that can
 * silently drift apart.
 */

/**
 * Data rows only. Counting every `row` role also catches the header and the
 * loading skeleton's leftover tutorial table (app/ui/skeletons.tsx still ships
 * "Customer / Email / Amount" headers), so rows are identified by the control
 * only a real record has.
 */
const dataRows = (page: Page) =>
  page
    .getByRole("row")
    .filter({ has: page.getByRole("button", { name: "Modifica" }) });

const readCount = async (page: Page) => {
  const text = await page.getByText(/\d+ di \d+ incantesim/).innerText();
  const [, filtered] = /(\d+) di/.exec(text) ?? [];

  return Number(filtered);
};

test.describe("pagination", () => {
  test("the reported count matches the rows actually rendered", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin/spells");

    const filtered = await readCount(page);
    expect(filtered).toBeGreaterThan(0);

    await expect(dataRows(page)).toHaveCount(filtered);
  });

  test("a filtered count also matches its rows", async ({ page }) => {
    await page.goto("/dashboard/admin/spells?query=Dardo");

    const filtered = await readCount(page);
    expect(filtered).toBe(1);

    await expect(dataRows(page)).toHaveCount(1);
  });

  test("the pagination control offers no page beyond the data", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin/spells");

    // Seeded data against a page size of 30 — one page, and the control should
    // say so rather than offering a page 2 that cannot exist.
    await expect(
      page.getByRole("link", { name: "2", exact: true })
    ).toHaveCount(0);
  });
});

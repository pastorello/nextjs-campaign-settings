import { test, expect, type Page } from "@playwright/test";

import { DEFAULT_ITEMS_PER_PAGE } from "@/app/lib/config/constants";

/**
 * Pagination, asserted as arithmetic rather than against a fixed dataset.
 *
 * Every assertion here derives from the count the page itself reports, so the
 * suite holds against the four seeded spells and against the DM's real library
 * of 361 — where the same maths means 13 pages instead of 1. An earlier version
 * asserted "rendered rows equal the reported count", which is only true while
 * everything fits on one page and would have broken the moment real data
 * arrived.
 *
 * The page-size comes from the app's own constant. Hardcoding 30 here would
 * mean a change to `DEFAULT_ITEMS_PER_PAGE` leaves a green suite behind.
 *
 * This is also TD-12's regression test at the UI level: rows and count are
 * built by two separately constructed queries that can silently drift apart.
 */

/**
 * Data rows only: counting every `row` role would also catch the header, so
 * rows are identified by the control only a real record has.
 *
 * The loading skeleton used to be caught here too — it shipped the tutorial's
 * "Customer / Email / Amount" table and appeared in the accessibility tree
 * while a page streamed. It is `aria-hidden` now, so role queries no longer
 * see it at all.
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
  test("the first page is full, or holds everything if there is less than a page", async ({
    page,
  }) => {
    await page.goto("/dashboard/admin/spells");

    const filtered = await readCount(page);
    expect(filtered).toBeGreaterThan(0);

    await expect(dataRows(page)).toHaveCount(
      Math.min(filtered, DEFAULT_ITEMS_PER_PAGE)
    );
  });

  test("the last page holds the remainder", async ({ page }) => {
    await page.goto("/dashboard/admin/spells");
    const filtered = await readCount(page);

    const lastPage = Math.ceil(filtered / DEFAULT_ITEMS_PER_PAGE);
    const expectedOnLastPage =
      filtered - (lastPage - 1) * DEFAULT_ITEMS_PER_PAGE;

    await page.goto(`/dashboard/admin/spells?page=${lastPage}`);

    await expect(dataRows(page)).toHaveCount(expectedOnLastPage);
    // The count is a property of the filter, not of the page being viewed.
    expect(await readCount(page)).toBe(filtered);
  });

  test("a field filter narrows the count as well as the rows", async ({
    page,
  }) => {
    // TD-12. `fetchFilteredSpells` and `getSpellsCount` each built a `where`
    // from their own copy of the field list, and the copies had drifted — the
    // count's was missing `name`. So this URL used to render "361 di 361
    // incantesimi trovati" above an empty table, with pagination offering
    // thirteen pages of nothing.
    await page.goto("/dashboard/admin/spells?name=Dardo");

    const filtered = await readCount(page);

    await expect(dataRows(page)).toHaveCount(
      Math.min(filtered, DEFAULT_ITEMS_PER_PAGE)
    );
  });

  test("a page beyond the last one renders no rows", async ({ page }) => {
    await page.goto("/dashboard/admin/spells");
    const filtered = await readCount(page);
    const beyond = Math.ceil(filtered / DEFAULT_ITEMS_PER_PAGE) + 1;

    await page.goto(`/dashboard/admin/spells?page=${beyond}`);

    await expect(dataRows(page)).toHaveCount(0);
  });

  test("a filtered count also matches its rows", async ({ page }) => {
    await page.goto("/dashboard/admin/spells?query=Dardo");

    const filtered = await readCount(page);
    expect(filtered).toBeGreaterThan(0);

    await expect(dataRows(page)).toHaveCount(
      Math.min(filtered, DEFAULT_ITEMS_PER_PAGE)
    );
  });
});

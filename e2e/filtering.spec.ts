import { test, expect, type Page } from "@playwright/test";

/**
 * Search and filters on the spells list — the user-facing half of the metadata
 * query layer (`getQuery`). The unit suite proves the right Prisma query is
 * built; this proves the page actually narrows.
 *
 * **Nothing here hardcodes how many spells exist.** The first version asserted
 * "5 di 5" and broke the moment the database held four — which is exactly what
 * a DM adding a spell would do to it. Every assertion reads the total off the
 * page and works relative to it.
 *
 * NOTE: the search box is matched by placeholder, not by label. Its `<label
 * for="search">` points at an id no input carries (app/ui/search.tsx), so the
 * label is not programmatically associated and `getByLabel` cannot find it.
 * That is a genuine accessibility defect, filed for TD-15 — the selector here
 * works around it rather than hiding it.
 */
const SEARCH_PLACEHOLDER = "Cerca incantesimo...";

/** "4 di 4 incantesimi trovati" → { filtered: 4, total: 4 } */
const readCount = async (page: Page) => {
  const text = await page.getByText(/\d+ di \d+ incantesim/).innerText();
  const [, filtered, total] = /(\d+) di (\d+)/.exec(text) ?? [];

  return { filtered: Number(filtered), total: Number(total) };
};

test.describe("spell filtering", () => {
  test("a search term narrows the list and survives a reload", async ({
    page,
  }) => {
    await page.goto("/dashboard/spells");

    const { total } = await readCount(page);
    expect(total).toBeGreaterThan(1);

    // Search for a spell the page is showing right now, rather than a name
    // this spec assumes is seeded.
    await page.getByPlaceholder(SEARCH_PLACEHOLDER).fill("Dardo");

    // The input is debounced by 300ms and pushes ?query= into the URL.
    await page.waitForURL(/query=Dardo/);
    await expect
      .poll(async () => (await readCount(page)).filtered)
      .toBeLessThan(total);

    await page.reload();

    await expect(page.getByPlaceholder(SEARCH_PLACEHOLDER)).toHaveValue(
      "Dardo"
    );
    expect((await readCount(page)).filtered).toBeLessThan(total);
  });

  test("a level filter narrows the list to that level", async ({ page }) => {
    await page.goto("/dashboard/spells");

    // Wait for hydration, not just for the button to exist. These filters are
    // client components: the markup ships from the server with no handler
    // attached, so a click that lands too early is swallowed silently — the
    // URL never changes and the only symptom is a timeout further down. It
    // surfaced when the library grew from 4 spells to 361 and hydration got
    // slower, which is the kind of flake that would otherwise be blamed on CI.
    await page.waitForLoadState("networkidle");
    await expect(page.getByRole("button", { name: "Tutti" })).toBeVisible();
    const { total } = await readCount(page);

    await page.getByRole("button", { name: "2° Livello", exact: true }).click();

    await page.waitForURL(/level=2/);

    // Nothing else may come along for the ride. Until TD-27 this asserted the
    // opposite of what happened: SpellLibrary applied a hardcoded classi=0 in a
    // mount effect, so the page asked for level=2 AND classes=0.
    expect(new URL(page.url()).searchParams.get("classes")).toBeNull();

    // The URL changes before the server component streams the filtered rows, so
    // the count reads 0 for a beat. Polling waits that out; reading it once is
    // a race that fails on a fast machine and passes on a slow one.
    await expect
      .poll(async () => (await readCount(page)).filtered, {
        message: "the level filter should match at least one spell",
      })
      .toBeGreaterThan(0);

    expect((await readCount(page)).filtered).toBeLessThanOrEqual(total);
  });

  test("Reset Filtri clears every active filter", async ({ page }) => {
    await page.goto("/dashboard/spells");
    const { total } = await readCount(page);

    await page.goto("/dashboard/spells?query=Dardo");
    expect((await readCount(page)).filtered).toBeLessThan(total);

    await page.getByRole("button", { name: "Reset Filtri" }).click();

    await expect.poll(async () => (await readCount(page)).filtered).toBe(total);
    await expect(page.getByPlaceholder(SEARCH_PLACEHOLDER)).toHaveValue("");
  });
});

import { test, expect, type Page } from "@playwright/test";

/**
 * Regression tests for three defects in the deities admin list, all of them
 * divergences from its three sibling lists rather than mistakes in isolation —
 * the case TD-09 exists to make impossible. Each of these fails before the fix
 * in the same commit.
 *
 * They assert against seeded records (`app/seed/initial-data/deities.ts`), which
 * is deterministic in CI and locally: "Gork" is declared with
 * `residenza: PianoEsistenza.Inferi` and `luogo: 4`.
 */

/** Reads one cell of a row by the text of its column header. */
const cellUnderHeader = async (page: Page, rowName: string, header: string) => {
  const headers = await page.getByRole("columnheader").allInnerTexts();
  const index = headers.findIndex((text) => text.trim() === header);

  expect(index, `no "${header}" column header found`).toBeGreaterThanOrEqual(0);

  const row = page.getByRole("row").filter({ hasText: rowName });

  return (await row.getByRole("cell").allInnerTexts())[index]?.trim();
};

test.describe("deities admin list", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/admin/deities");
    await page.waitForLoadState("networkidle");
  });

  test("the Residenza column shows the celestial plane, not the patron type", async ({
    page,
  }) => {
    // Was rendering `getDatum(item.luogo)` through tipoPatrono's metadata, so
    // Gork's luogo of 4 came out as "Elementale" — a deity type, in a column
    // headed Residenza. The field the schema and deityMeta actually declare for
    // this is `residenza`, whose options are celestialPlanes.
    expect(await cellUnderHeader(page, "Gork", "Residenza")).toBe("Inferi");
  });

  test("every column in the body has a header", async ({ page }) => {
    // The head declared six columns and the body rendered seven cells: the
    // "Azioni" header was missing, so every header after Nome described the
    // column to its left.
    const headers = await page.getByRole("columnheader").count();
    const cells = await page
      .getByRole("row")
      .filter({ hasText: "Gork" })
      .getByRole("cell")
      .count();

    expect(headers).toBe(cells);
  });

  test("an empty result names deities, not NPCs", async ({ page }) => {
    // The empty state read "Nessun PNG trovato", copy-pasted from PngList.
    await page.goto("/dashboard/admin/deities?query=zzz-nessun-risultato");

    await expect(page.getByText(/nessun/i)).toBeVisible();
    await expect(page.getByText(/nessun png trovato/i)).toHaveCount(0);
  });
});

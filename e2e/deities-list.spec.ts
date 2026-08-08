import { test, expect } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * Regression tests for two defects in the deities admin list, both of them
 * divergences from its three sibling lists rather than mistakes in isolation —
 * the case TD-09 exists to make impossible. Each of these fails before the fix
 * in the same commit.
 *
 * They assert against seeded records (`app/seed/initial-data/deities.ts`), which
 * is deterministic in CI and locally: "Gork" is one of the seeded deities.
 *
 * A third regression test used to live here — the Residenza column rendering
 * the wrong field's options — but that column itself is gone as of SPEC-004
 * T5b, replaced by the tree-derived `derivedLocation` column (covered by
 * T5a's own tests, not this file).
 */

test.describe("deities admin list", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/admin/deities");
    await page.waitForLoadState("networkidle");
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

    await expect(
      page.getByText(messages.deities.page.emptyMessage)
    ).toBeVisible();
    await expect(page.getByText(messages.npc.page.emptyMessage)).toHaveCount(0);
  });
});

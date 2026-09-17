import { test, expect } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * Phone-viewport regressions from the 2026-09-17 design critique at 375px:
 *
 * - TD-113: the admin lists render their table as `hidden md:table` with no
 *   fallback, so below `md` a phone showed an empty grey strip and nothing
 *   else — no way to see, edit or delete a row.
 * - TD-114: three separate causes pushed the page wider than the viewport
 *   itself — a fixed 900px form, a list header row that couldn't wrap, and a
 *   ten-tile nav row with no way to reach the tiles past the right edge.
 */
const PHONE_WIDTH = 375;

test.describe("phone viewport (375×812)", () => {
  test.use({ viewport: { width: PHONE_WIDTH, height: 812 } });

  test("TD-113: the admin spells list shows a row and its edit/delete actions on a phone", async ({
    page,
  }) => {
    await page.goto("/dashboard/dnd5e/admin/spells");
    await page.waitForLoadState("networkidle");

    // "Aiuto" is a seeded spell (app/seed/initial-data/spells.ts). The
    // phone fallback carries its own `data-testid`, distinct from the
    // (CSS-)hidden desktop table, which renders the same name.
    const mobileList = page.getByTestId("entity-list-mobile");
    await expect(mobileList.getByText("Aiuto", { exact: true })).toBeVisible();

    // The row's own actions, not just its name — an icon button (TD-118),
    // so it is found by role and an accessible name that still contains
    // "Modifica"/"Elimina" rather than by visible text.
    const row = mobileList.locator("li").filter({ hasText: "Aiuto" });
    await expect(
      row.getByRole("button", { name: new RegExp(messages.common.table.edit) })
    ).toBeVisible();
    const deleteButton = row.getByRole("button", {
      name: new RegExp(messages.common.form.delete),
    });
    await expect(deleteButton).toBeVisible();
    // Visible is not enough: on 2026-09-17 the list was 20px wider than the
    // screen and this button was half cut off at the right edge while
    // `toBeVisible` still passed.
    const box = await deleteButton.boundingBox();
    expect(box).not.toBeNull();
    expect(box!.x + box!.width).toBeLessThanOrEqual(PHONE_WIDTH);
  });

  const PAGES: Array<[string, string]> = [
    ["a list", "/dashboard/dnd5e/admin/spells"],
    ["a form", "/dashboard/dnd5e/admin/spells/new"],
    ["the overview", "/dashboard/dnd5e"],
    // The public lists and the campaign page overflowed too (filter chips
    // that did not wrap, fixed-width NPC columns, the adventure table).
    ["the public spells list", "/dashboard/dnd5e/spells"],
    ["the public NPC list", "/dashboard/dnd5e/npc"],
    ["the campaigns page", "/dashboard/dnd5e/campaign"],
  ];

  for (const [label, path] of PAGES) {
    test(`TD-114: ${label} (${path}) does not overflow the viewport horizontally`, async ({
      page,
    }) => {
      await page.goto(path);
      await page.waitForLoadState("networkidle");

      // Against the fixed viewport width, not `window.innerWidth`: under
      // mobile emulation the layout viewport grows with overflowing content,
      // so comparing the page with itself can pass while it overflows.
      const scrollWidth = await page.evaluate(
        () => document.documentElement.scrollWidth
      );

      expect(scrollWidth).toBeLessThanOrEqual(PHONE_WIDTH);
    });
  }
});

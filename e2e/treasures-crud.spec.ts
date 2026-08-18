import { test, expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * The full create → read → update → delete round trip for treasure catalogue
 * entries, driven through the UI exactly as a DM would. See
 * magicitems-crud.spec.ts for the naming/query/dialog conventions this
 * follows — the treasure catalogue is the seventh domain (SPEC-013 T4b) and
 * its e2e coverage is new.
 *
 * `queryFields.ts` deliberately excludes `name` from treasure's per-field
 * filters, but the free-text `?query=` search always matches on `name`
 * regardless of domain (`getQuery.ts`), so `gotoTreasure` below works the
 * same way it does for every other domain.
 */
const uniqueName = () => `E2E Tesoro ${Date.now()}`;

const gotoTreasureAdmin = async (page: Page) => {
  await page.goto("/dashboard/admin/treasures");
  await expect(
    page.getByRole("heading", { name: messages.treasure.page.title })
  ).toBeVisible();
};

/** See spells-crud.spec.ts: a new record is not on page 1 of a real library. */
const gotoTreasure = async (page: Page, name: string) => {
  await page.goto(
    `/dashboard/admin/treasures?query=${encodeURIComponent(name)}`
  );
};

const rowFor = (page: Page, name: string) =>
  page.getByRole("row").filter({ hasText: name });

test.describe("treasure catalogue CRUD", () => {
  test("a treasure entry can be created, edited and deleted", async ({
    page,
  }) => {
    const name = uniqueName();
    const editedName = `${name} mod`;

    // --- Create -------------------------------------------------------------
    await gotoTreasureAdmin(page);
    await page
      .getByRole("link", { name: messages.treasure.page.newItemButton })
      .click();

    await expect(
      page.getByRole("heading", {
        name: messages.treasure.form.createTitle,
      })
    ).toBeVisible();

    await page.getByLabel(messages.common.fields.name.label).fill(name);
    await page
      .getByRole("button", { name: messages.treasure.form.createButton })
      .click();

    await page.waitForURL("**/dashboard/admin/treasures");

    await gotoTreasure(page, name);
    await expect(rowFor(page, name)).toBeVisible();

    // --- Update -------------------------------------------------------------
    await rowFor(page, name)
      .getByRole("button", { name: messages.common.table.edit })
      .click();

    const editDialog = page.getByRole("dialog");

    // See spells-crud.spec.ts: the dialog title is rendered twice, so a
    // heading query here is a strict-mode violation.
    await expect(
      editDialog.getByLabel(messages.common.fields.name.label)
    ).toBeVisible();

    await editDialog
      .getByLabel(messages.common.fields.name.label)
      .fill(editedName);
    await editDialog
      .getByRole("button", { name: messages.treasure.form.editButton })
      .click();

    await expect(editDialog).toHaveCount(0);

    await gotoTreasure(page, editedName);
    await expect(rowFor(page, editedName)).toBeVisible();

    // --- Delete -------------------------------------------------------------
    await rowFor(page, editedName)
      .getByRole("button", { name: messages.common.form.delete })
      .click();

    const confirmDialog = page.getByRole("dialog");
    await expect(
      confirmDialog.getByText(messages.common.deleteButton.confirmDescription)
    ).toBeVisible();

    await confirmDialog
      .getByRole("button", { name: messages.common.form.delete })
      .click();

    await expect(rowFor(page, editedName)).toHaveCount(0);
  });
});

import { test, expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * The full create → read → update → delete round trip for magic items,
 * driven through the UI exactly as a DM would. See spells-crud.spec.ts for
 * the naming/query/dialog conventions this follows — magic items had no e2e
 * CRUD coverage at all before this (TD-80).
 *
 * `queryFields.ts` deliberately excludes `name` from magic items' per-field
 * filters, but the free-text `?query=` search always matches on `name`
 * regardless of domain (`getQuery.ts`), so `gotoMagicItem` below works the
 * same way it does for every other domain.
 */
const uniqueName = () => `E2E Oggetto ${Date.now()}`;

const gotoMagicItemAdmin = async (page: Page) => {
  await page.goto("/dashboard/admin/magicitems");
  await expect(
    page.getByRole("heading", { name: messages.magicItems.page.title })
  ).toBeVisible();
};

/** See spells-crud.spec.ts: a new record is not on page 1 of a real library. */
const gotoMagicItem = async (page: Page, name: string) => {
  await page.goto(
    `/dashboard/admin/magicitems?query=${encodeURIComponent(name)}`
  );
};

const rowFor = (page: Page, name: string) =>
  page.getByRole("row").filter({ hasText: name });

test.describe("magic items CRUD", () => {
  test("a magic item can be created, edited and deleted", async ({ page }) => {
    const name = uniqueName();
    const editedName = `${name} mod`;

    // --- Create -------------------------------------------------------------
    await gotoMagicItemAdmin(page);
    await page
      .getByRole("link", { name: messages.magicItems.page.newItemButton })
      .click();

    await expect(
      page.getByRole("heading", {
        name: messages.magicItems.form.createTitle,
      })
    ).toBeVisible();

    await page.getByLabel(messages.common.fields.name.label).fill(name);
    await page
      .getByRole("button", { name: messages.magicItems.form.createButton })
      .click();

    await page.waitForURL("**/dashboard/admin/magicitems");

    await gotoMagicItem(page, name);
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
      .getByRole("button", { name: messages.magicItems.form.editButton })
      .click();

    await expect(editDialog).toHaveCount(0);

    await gotoMagicItem(page, editedName);
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

import { test, expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * The full create → read → update → delete round trip for deities, driven
 * through the UI exactly as a DM would. See spells-crud.spec.ts for the
 * reasoning behind the naming/query/dialog conventions this follows —
 * deities was previously covered only by deities-list.spec.ts (list
 * rendering against seeded rows), with no create/update/delete flow (TD-80).
 *
 * Every field besides Nome keeps its form default (each select's first
 * option), the same approach npc-crud.spec.ts takes for the domain with the
 * next-most fields — the round trip exercises the mutation and the metadata
 * layer, not every individual select.
 */
const uniqueName = () => `E2E Divinità ${Date.now()}`;

const gotoDeityAdmin = async (page: Page) => {
  await page.goto("/dashboard/admin/deities");
  await expect(
    page.getByRole("heading", { name: messages.deities.page.title })
  ).toBeVisible();
};

/** See spells-crud.spec.ts: a new record is not on page 1 of a real library. */
const gotoDeity = async (page: Page, name: string) => {
  await page.goto(`/dashboard/admin/deities?query=${encodeURIComponent(name)}`);
};

const rowFor = (page: Page, name: string) =>
  page.getByRole("row").filter({ hasText: name });

test.describe("deities CRUD", () => {
  test("a deity can be created, edited and deleted", async ({ page }) => {
    const name = uniqueName();
    const editedName = `${name} mod`;

    // --- Create -------------------------------------------------------------
    await gotoDeityAdmin(page);
    await page
      .getByRole("link", { name: messages.deities.page.newItemButton })
      .click();

    await expect(
      page.getByRole("heading", { name: messages.deities.form.createTitle })
    ).toBeVisible();

    await page.getByLabel(messages.common.fields.name.label).fill(name);
    await page
      .getByRole("button", { name: messages.deities.form.createButton })
      .click();

    await page.waitForURL("**/dashboard/admin/deities");

    await gotoDeity(page, name);
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
      .getByRole("button", { name: messages.deities.form.editButton })
      .click();

    await expect(editDialog).toHaveCount(0);

    await gotoDeity(page, editedName);
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

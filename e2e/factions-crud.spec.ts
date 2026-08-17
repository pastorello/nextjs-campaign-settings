import { test, expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * The full create → read → update → delete round trip for factions, driven
 * through the UI exactly as a DM would. See spells-crud.spec.ts for the
 * naming/query/dialog conventions this follows — factions had no e2e CRUD
 * coverage at all before this (TD-80).
 */
const uniqueName = () => `E2E Fazione ${Date.now()}`;

const gotoFactionAdmin = async (page: Page) => {
  await page.goto("/dashboard/admin/factions");
  await expect(
    page.getByRole("heading", { name: messages.factions.page.title })
  ).toBeVisible();
};

/** See spells-crud.spec.ts: a new record is not on page 1 of a real library. */
const gotoFaction = async (page: Page, name: string) => {
  await page.goto(
    `/dashboard/admin/factions?query=${encodeURIComponent(name)}`
  );
};

const rowFor = (page: Page, name: string) =>
  page.getByRole("row").filter({ hasText: name });

test.describe("factions CRUD", () => {
  test("a faction can be created, edited and deleted", async ({ page }) => {
    const name = uniqueName();
    const editedName = `${name} mod`;

    // --- Create -------------------------------------------------------------
    await gotoFactionAdmin(page);
    await page
      .getByRole("link", { name: messages.factions.page.newItemButton })
      .click();

    await expect(
      page.getByRole("heading", { name: messages.factions.form.createTitle })
    ).toBeVisible();

    await page.getByLabel(messages.common.fields.name.label).fill(name);
    await page
      .getByRole("button", { name: messages.factions.form.createButton })
      .click();

    await page.waitForURL("**/dashboard/admin/factions");

    await gotoFaction(page, name);
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
      .getByRole("button", { name: messages.factions.form.editButton })
      .click();

    await expect(editDialog).toHaveCount(0);

    await gotoFaction(page, editedName);
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

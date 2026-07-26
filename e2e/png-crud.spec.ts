import { test, expect, type Page } from "@playwright/test";

/**
 * The same round trip for NPCs — the domain with the most fields, so it is the
 * one most likely to break when the metadata layer changes (TD-08, TD-19).
 *
 * See spells-crud.spec.ts for why the dialog assertions target elements inside
 * the dialog rather than the dialog itself.
 */
const uniqueName = () => `E2E PNG ${Date.now()}`;

/** See spells-crud.spec.ts: a new record is not on page 1 of a real library. */
const gotoPng = async (page: Page, name: string) => {
  await page.goto(`/dashboard/admin/png?query=${encodeURIComponent(name)}`);
};

const rowFor = (page: Page, name: string) =>
  page.getByRole("row").filter({ hasText: name });

test.describe("NPC CRUD", () => {
  test("an NPC can be created, edited and deleted", async ({ page }) => {
    const name = uniqueName();
    const editedName = `${name} mod`;

    await page.goto("/dashboard/admin/png");
    await page.getByRole("link", { name: "Nuovo PNG" }).click();

    await expect(
      page.getByRole("heading", { name: "Crea nuovo PNG" })
    ).toBeVisible();

    await page.getByLabel("Nome").fill(name);
    await page.getByRole("button", { name: "Crea PNG" }).click();

    await page.waitForURL("**/dashboard/admin/png");

    await gotoPng(page, name);
    await expect(rowFor(page, name)).toBeVisible();

    await rowFor(page, name).getByRole("button", { name: "Modifica" }).click();

    const editDialog = page.getByRole("dialog");

    // See spells-crud.spec.ts: the dialog title is rendered twice, so a heading
    // query here is a strict-mode violation.
    await expect(editDialog.getByLabel("Nome")).toBeVisible();

    await editDialog.getByLabel("Nome").fill(editedName);
    await editDialog.getByRole("button", { name: "Modifica PNG" }).click();

    await expect(editDialog).toHaveCount(0);

    await gotoPng(page, editedName);
    await expect(rowFor(page, editedName)).toBeVisible();

    await rowFor(page, editedName)
      .getByRole("button", { name: "Delete" })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: "Delete" })
      .click();

    await expect(rowFor(page, editedName)).toHaveCount(0);
  });
});

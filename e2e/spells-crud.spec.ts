import { test, expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * The full create → read → update → delete round trip for spells, driven
 * through the UI exactly as a DM would.
 *
 * Each run works on its own record, named with a timestamp, so a failed run
 * cannot poison the next one and the suite never touches existing spells.
 * **A spec that deletes must only ever delete a record it created itself** —
 * an earlier draft of validation.spec.ts aimed a DELETE at a hardcoded id and
 * permanently removed a real one.
 *
 * NOTE on the dialog selectors: the element carrying `role="dialog"` is
 * Headless UI's `<Dialog>` root, which is `position: relative` with its content
 * in `fixed` children — so it has no bounding box and Playwright reports it as
 * hidden. Assertions therefore target something *inside* it. Scoping
 * (`dialog.getByLabel(...)`) works fine, since that is DOM containment.
 */
const uniqueName = () => `E2E Incantesimo ${Date.now()}`;

const gotoSpellAdmin = async (page: Page) => {
  await page.goto("/dashboard/admin/spells");
  await expect(
    page.getByRole("heading", { name: messages.spells.page.title })
  ).toBeVisible();
};

/**
 * Opens the admin list filtered to one spell.
 *
 * Going to the unfiltered list and looking for the row does not work against a
 * real library: the list is 30 rows per page ordered by name, so a spell called
 * "E2E Incantesimo 1785…" sits on page 6 of 13 and is simply not on screen.
 * Searching for it is both robust at any size and what a DM would actually do.
 */
const gotoSpell = async (page: Page, name: string) => {
  await page.goto(`/dashboard/admin/spells?query=${encodeURIComponent(name)}`);
};

/** The table row whose name cell matches. */
const rowFor = (page: Page, name: string) =>
  page.getByRole("row").filter({ hasText: name });

test.describe("spells CRUD", () => {
  test("a spell can be created, edited and deleted", async ({ page }) => {
    const name = uniqueName();
    const editedName = `${name} mod`;

    // --- Create -------------------------------------------------------------
    await gotoSpellAdmin(page);
    await page
      .getByRole("link", { name: messages.spells.page.newItemButton })
      .click();

    await expect(
      page.getByRole("heading", { name: messages.spells.form.createTitle })
    ).toBeVisible();

    await page.getByLabel(messages.common.fields.name.label).fill(name);
    await page
      .getByRole("button", { name: messages.spells.form.createButton })
      .click();

    await page.waitForURL("**/dashboard/admin/spells");

    await gotoSpell(page, name);
    await expect(rowFor(page, name)).toBeVisible();

    // --- Update -------------------------------------------------------------
    await rowFor(page, name)
      .getByRole("button", { name: messages.common.table.edit })
      .click();

    const editDialog = page.getByRole("dialog");

    // Asserting on the Nome field rather than the dialog title: the title
    // appears twice inside the dialog — Modal renders a <DialogTitle> h2 and
    // SpellForm renders its own h1 with the same text — so a heading query is
    // a strict-mode violation. Duplicated, out of order (h1 inside h2's
    // dialog) and worth cleaning up, but not this change's business.
    await expect(
      editDialog.getByLabel(messages.common.fields.name.label)
    ).toBeVisible();

    await editDialog
      .getByLabel(messages.common.fields.name.label)
      .fill(editedName);
    await editDialog
      .getByRole("button", { name: messages.spells.form.editButton })
      .click();

    await expect(editDialog).toHaveCount(0);

    await gotoSpell(page, editedName);
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

  test("cancelling the delete dialog keeps the record", async ({ page }) => {
    const name = uniqueName();

    // Created here rather than borrowing a seeded spell: this test must not be
    // able to remove real data even if the cancel button stops working.
    await gotoSpellAdmin(page);
    await page
      .getByRole("link", { name: messages.spells.page.newItemButton })
      .click();

    // This assertion is load-bearing, not decoration. `getByLabel` matches by
    // case-insensitive substring, and the list page's sort button is now named
    // "Ordina per nome" (TD-15 gave it an accessible name) — so `getByLabel`
    // ("Nome") resolves to that button the instant it is evaluated, instead of
    // finding nothing and waiting for the form to render. Wait for the heading
    // first, and the ambiguity is gone because the list page is.
    await expect(
      page.getByRole("heading", { name: messages.spells.form.createTitle })
    ).toBeVisible();

    await page.getByLabel(messages.common.fields.name.label).fill(name);
    await page
      .getByRole("button", { name: messages.spells.form.createButton })
      .click();
    await page.waitForURL("**/dashboard/admin/spells");

    await gotoSpell(page, name);
    const target = rowFor(page, name);
    await expect(target).toBeVisible();

    await target
      .getByRole("button", { name: messages.common.form.delete })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: messages.common.form.cancel })
      .click();

    await expect(page.getByRole("dialog")).toHaveCount(0);
    await expect(target).toBeVisible();

    // Clean up after itself.
    await target
      .getByRole("button", { name: messages.common.form.delete })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: messages.common.form.delete })
      .click();
    await expect(target).toHaveCount(0);
  });
});

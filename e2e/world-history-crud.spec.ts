import { test, expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * World history (SPEC-014 T5): create an event linked to a place, see it in
 * the list with the place as a link, edit it, delete it — through the UI,
 * as the DM would. The `world-setup` project has created the root place, so
 * there is always at least one place to link.
 *
 * The event is dated in the universal count's year 0 (the first system in
 * every date picker), so it sorts onto the list's first page however much
 * history the test database already holds.
 */
const uniqueTitle = () => `E2E Evento ${Date.now()}`;

const gotoHistory = async (page: Page) => {
  await page.goto("/dashboard/dnd5e/world/history");
  // The add/edit/delete buttons are client-side; a click that lands before
  // hydration is swallowed (seen on CI, 2026-09-18).
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: messages.calendar.history.page.title })
  ).toBeVisible();
};

const eventItem = (page: Page, title: string) =>
  page.getByTestId("world-history-event").filter({ hasText: title });

test.describe("world history CRUD", () => {
  test("an event linked to a place can be created, edited and deleted", async ({
    page,
  }) => {
    const title = uniqueTitle();
    const editedTitle = `${title} mod`;

    // --- Create -------------------------------------------------------------
    await gotoHistory(page);
    await page
      .getByRole("button", { name: messages.calendar.history.list.addButton })
      .click();

    await page
      .getByLabel(messages.calendar.event.fields.title.label, { exact: true })
      .fill(title);
    await page
      .getByLabel(messages.calendar.input.system, { exact: true })
      .selectOption({ index: 0 });
    await page
      .getByLabel(messages.calendar.input.year, { exact: true })
      .fill("0");
    await page
      .getByLabel(messages.calendar.input.day, { exact: true })
      .fill("1");

    // The places multiselect: open it and take the first place offered.
    await page
      .getByTestId("form-select")
      .filter({ hasText: messages.calendar.event.fields.zoneIds.label })
      .getByRole("button")
      .click();
    const firstPlace = page.getByRole("option").first();
    const placeName = (await firstPlace.textContent())?.trim() ?? "";
    expect(placeName).not.toBe("");
    await firstPlace.click();
    await page.keyboard.press("Escape");

    await page
      .getByRole("button", { name: messages.calendar.event.form.createButton })
      .click();

    const created = eventItem(page, title);
    await expect(created).toBeVisible();
    await expect(
      created.getByRole("link", { name: placeName, exact: true })
    ).toHaveAttribute("href", /\/geography\?place=\d+$/);

    // --- Update -------------------------------------------------------------
    // Once open, the item holds the form, whose title is an input value that
    // `hasText` cannot see — so the form is found on the page, where it is
    // the only one open.
    await created
      .getByRole("button", { name: messages.common.table.edit })
      .click();
    await page
      .getByLabel(messages.calendar.event.fields.title.label, { exact: true })
      .fill(editedTitle);
    await page
      .getByRole("button", { name: messages.calendar.event.form.editButton })
      .click();

    const edited = eventItem(page, editedTitle);
    await expect(edited).toBeVisible();
    await expect(
      edited.getByRole("link", { name: placeName, exact: true })
    ).toBeVisible();

    // --- Delete -------------------------------------------------------------
    await edited
      .getByRole("button", { name: messages.common.form.delete })
      .click();

    const confirmDialog = page.getByRole("dialog");
    await expect(
      confirmDialog.getByText(messages.common.deleteButton.confirmDescription)
    ).toBeVisible();
    await confirmDialog
      .getByRole("button", { name: messages.common.form.delete })
      .click();

    await expect(eventItem(page, editedTitle)).toHaveCount(0);
  });
});

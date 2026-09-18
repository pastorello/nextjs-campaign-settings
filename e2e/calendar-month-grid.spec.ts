import { test, expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * The month grid (SPEC-014 T7), on world history: an event created on a
 * known day shows on that day of its month's grid, the grid moves month by
 * month through the URL, and the event opens the list's edit form.
 *
 * The event is dated 15 January of the universal count's year 0 (the first
 * system in every date picker), so its month is `?year=0&month=1` whatever
 * the default system is, and it sorts onto the list's first page for the
 * clean-up however much history the test database already holds.
 */
const uniqueTitle = () => `E2E Griglia ${Date.now()}`;

const HISTORY = "/dashboard/dnd5e/world/history";
const JANUARY_OF_YEAR_0 = `${HISTORY}?view=grid&year=0&month=1`;

// Client-side buttons swallow a click that lands before hydration (seen on
// CI, 2026-09-18), so every visit waits for the network to settle.
const visit = async (page: Page, url: string) => {
  await page.goto(url);
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: messages.calendar.history.page.title })
  ).toBeVisible();
};

const dayCell = (page: Page, day: number) =>
  page.locator(`[data-testid="month-grid-day"][data-day="${day}"]`);

const gridEvent = (page: Page, title: string) =>
  page.getByTestId("world-history-grid-event").filter({ hasText: title });

test.describe("month grid", () => {
  test("shows an event on its day and moves between months", async ({
    page,
  }) => {
    const title = uniqueTitle();

    // --- Create, from the list ----------------------------------------------
    await visit(page, HISTORY);
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
      .fill("15");
    await page
      .getByRole("button", { name: messages.calendar.event.form.createButton })
      .click();
    await expect(
      page.getByTestId("world-history-event").filter({ hasText: title })
    ).toBeVisible();

    try {
      // --- The view switch opens the grid -----------------------------------
      await page
        .getByRole("link", { name: messages.calendar.grid.month, exact: true })
        .click();
      await expect(page).toHaveURL(/view=grid/);
      await expect(page.getByTestId("month-grid")).toBeVisible();

      // --- The event's month, by URL: it sits on its day --------------------
      await visit(page, JANUARY_OF_YEAR_0);
      const grid = page.getByTestId("month-grid");
      await expect(grid.getByRole("columnheader")).toHaveCount(7);
      await expect(dayCell(page, 15).getByText(title)).toBeVisible();
      await expect(dayCell(page, 14).getByText(title)).toHaveCount(0);

      // --- Next month, then back ---------------------------------------------
      await page
        .getByRole("link", { name: messages.calendar.grid.nextMonth })
        .click();
      await expect(page).toHaveURL(/year=0&month=2/);
      await expect(gridEvent(page, title)).toHaveCount(0);

      await page.waitForLoadState("networkidle");
      await page
        .getByRole("link", { name: messages.calendar.grid.previousMonth })
        .click();
      await expect(page).toHaveURL(/year=0&month=1/);
      await expect(gridEvent(page, title)).toBeVisible();

      // --- The event opens the list's edit form ------------------------------
      await page.waitForLoadState("networkidle");
      await gridEvent(page, title).getByRole("button").click();
      const dialog = page.getByRole("dialog");
      await expect(
        dialog.getByLabel(messages.calendar.event.fields.title.label, {
          exact: true,
        })
      ).toHaveValue(title);
      await dialog
        .getByRole("button", { name: messages.common.form.cancel })
        .click();
      await expect(dialog).toHaveCount(0);
    } finally {
      // --- Clean up, from the list --------------------------------------------
      await visit(page, HISTORY);
      await page
        .getByTestId("world-history-event")
        .filter({ hasText: title })
        .getByRole("button", { name: messages.common.form.delete })
        .click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: messages.common.form.delete })
        .click();
      await expect(
        page.getByTestId("world-history-event").filter({ hasText: title })
      ).toHaveCount(0);
    }
  });
});

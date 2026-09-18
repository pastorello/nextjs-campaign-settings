import { test, expect, type Locator, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * The campaign calendar (SPEC-014 T6): set the campaign's "today", add an
 * event before it and one after it, see the first dimmed as past and the
 * second among the campaign page's upcoming events, then delete both and
 * clear today — through the UI, as the DM would.
 *
 * The dnd5e campaign is created if the test database has none (the
 * campaign has no delete, so it stays for later runs, which reuse it).
 * Every date is in the universal count's year 0 (the first system in
 * every date picker), which sorts before any other event the database
 * holds, so the future event is the first one coming up.
 */
const CALENDAR = "/dashboard/dnd5e/campaign/calendar";
const CAMPAIGN = "/dashboard/dnd5e/campaign";

const input = messages.calendar.input;
const list = messages.calendar.campaign.list;
const today = messages.calendar.campaign.today;

// The buttons are client-side; a click that lands before hydration is
// swallowed (seen on CI, 2026-09-18).
const settle = (page: Page) => page.waitForLoadState("networkidle");

async function ensureCampaign(page: Page) {
  await page.goto(CAMPAIGN);
  await settle(page);
  const create = page.getByRole("button", {
    name: messages.campaign.form.createButton,
  });
  if (!(await create.isVisible().catch(() => false))) return;

  await page
    .getByLabel(messages.campaign.fields.title.label, { exact: true })
    .fill(`E2E Campagna ${Date.now()}`);
  await create.click();
  await expect(create).toBeHidden();
}

/** Types day `day` of January, year 0 of the universal count. */
async function fillDate(scope: Locator, day: number) {
  await scope.getByLabel(input.system, { exact: true }).selectOption({
    index: 0,
  });
  await scope.getByLabel(input.year, { exact: true }).fill("0");
  await scope.getByLabel(input.month, { exact: true }).selectOption({
    index: 0,
  });
  await scope.getByLabel(input.day, { exact: true }).fill(String(day));
}

async function addEvent(page: Page, title: string, day: number) {
  await page.getByRole("button", { name: list.addButton }).click();
  const titleInput = page.getByLabel(
    messages.calendar.event.fields.title.label,
    { exact: true }
  );
  const form = page.locator("form").filter({ has: titleInput });
  await titleInput.fill(title);
  await fillDate(form, day);
  await form
    .getByRole("button", { name: messages.calendar.event.form.createButton })
    .click();
  await expect(eventItem(page, title)).toBeVisible();
}

const eventItem = (page: Page, title: string) =>
  page.getByTestId("campaign-event").filter({ hasText: title });

async function deleteEvent(page: Page, title: string) {
  await eventItem(page, title)
    .getByRole("button", { name: messages.common.form.delete })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: messages.common.form.delete })
    .click();
  await expect(eventItem(page, title)).toHaveCount(0);
}

test.describe("campaign calendar", () => {
  test("today splits past from upcoming, on the calendar and the campaign page", async ({
    page,
  }) => {
    const stamp = Date.now();
    const pastTitle = `E2E Prima ${stamp}`;
    const futureTitle = `E2E Dopo ${stamp}`;

    await ensureCampaign(page);
    await page.goto(CALENDAR);
    await settle(page);
    await expect(
      page.getByRole("heading", {
        name: messages.calendar.campaign.page.title,
      })
    ).toBeVisible();

    // --- Set today: 10 January, year 0 ------------------------------------
    const currentDay = page.getByTestId("current-day");
    await fillDate(currentDay, 10);
    await currentDay
      .getByRole("button", { name: messages.common.form.save })
      .click();
    await expect(page.getByTestId("current-day-value")).not.toHaveText(
      today.unset
    );

    // --- One event before today, one after -------------------------------
    await addEvent(page, pastTitle, 1);
    await addEvent(page, futureTitle, 20);

    await expect(eventItem(page, pastTitle)).toHaveAttribute(
      "data-timing",
      "past"
    );
    await expect(eventItem(page, pastTitle)).toContainText(list.past);
    await expect(eventItem(page, futureTitle)).toHaveAttribute(
      "data-timing",
      "upcoming"
    );

    // --- The campaign page shows the future one coming up ----------------
    await page.goto(CAMPAIGN);
    const upcoming = page.getByTestId("upcoming-events");
    await expect(upcoming).toContainText(futureTitle);
    await expect(upcoming).not.toContainText(pastTitle);

    // --- Restore: delete both, clear today --------------------------------
    await page.goto(CALENDAR);
    await settle(page);
    await deleteEvent(page, pastTitle);
    await deleteEvent(page, futureTitle);

    await page.getByRole("button", { name: today.clearButton }).click();
    await expect(page.getByTestId("current-day-value")).toHaveText(today.unset);
  });
});

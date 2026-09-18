import { test, expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * The date systems panel (SPEC-014 T3), driven through the UI: create a
 * system, make it the default, see the moon's reference date re-labelled
 * in it, then put everything back — the universal count the default again,
 * the system deleted, the moon reference cleared if this spec set it.
 *
 * **The universal count must end as the default.** Every other spec, and
 * every date on every page, reads years in the default system; the cleanup
 * runs in a `finally` so a failed assertion cannot leave the test database
 * re-labelled for whatever runs next.
 */
const PATH = "/dashboard/dnd5e/world/calendar";
const copy = messages.calendar;

const gotoPanel = async (page: Page) => {
  await page.goto(PATH);
  // Row buttons are client-side; a click that lands before hydration is
  // swallowed (seen on CI, 2026-09-18).
  await page.waitForLoadState("networkidle");
  await expect(
    page.getByRole("heading", { name: copy.systems.title })
  ).toBeVisible();
};

const fill = (page: Page, label: string, value: string) =>
  page.getByLabel(label, { exact: true }).fill(value);

const numbered = (template: string, number: number) =>
  template.replace("{number}", String(number));

// Scoped to the systems list: the success toast is a listitem too, and it
// names the system it just made default ("“Calendario universale” è ora…").
const rowFor = (page: Page, text: string) =>
  page
    .getByRole("list", { name: copy.systems.title, exact: true })
    .getByRole("listitem")
    .filter({ hasText: text });

const moonLine = (page: Page) => page.getByText(copy.moon.current);

test.describe("date systems panel", () => {
  test("a date system can be created, made the default and deleted", async ({
    page,
  }) => {
    const stamp = Date.now();
    const name = `E2E Calendario ${stamp}`;
    const abbrev = `E2E${stamp}`;
    let setMoon = false;
    let created = false;

    await gotoPanel(page);

    try {
      // --- The moon reference, in the universal count ---------------------
      // Universal year 5; with the new system anchored on year 3 it reads as
      // year 2 there. Only set when unset, so the DM's own value survives.
      if (await page.getByText(copy.moon.notSet).isVisible()) {
        await fill(page, copy.input.year, "5");
        await fill(page, copy.input.day, "1");
        await page
          .getByRole("button", { name: messages.common.form.save, exact: true })
          .click();
        await expect(page.getByText(copy.moon.notSet)).toHaveCount(0);
        setMoon = true;
      }

      // --- Create -------------------------------------------------------
      await page
        .getByRole("button", { name: copy.systems.addButton, exact: true })
        .click();
      await fill(page, copy.systems.fields.name, name);
      await fill(page, copy.systems.fields.anchorEvent, "Fondazione E2E");
      await fill(page, copy.systems.fields.anchorYear, "3");
      await fill(page, copy.systems.fields.afterLabel, "Dopo la fondazione");
      await fill(page, copy.systems.fields.afterAbbrev, abbrev);
      await fill(
        page,
        copy.systems.fields.beforeLabel,
        "Prima della fondazione"
      );
      await fill(page, copy.systems.fields.beforeAbbrev, `pre${abbrev}`);
      for (let month = 1; month <= 12; month++) {
        await fill(
          page,
          numbered(copy.systems.form.monthName, month),
          `Mese E2E ${month}`
        );
      }
      for (let weekday = 1; weekday <= 7; weekday++) {
        await fill(
          page,
          numbered(copy.systems.form.weekdayName, weekday),
          `Giorno E2E ${weekday}`
        );
      }
      await page
        .getByRole("button", {
          name: copy.systems.form.createButton,
          exact: true,
        })
        .click();

      await expect(rowFor(page, name)).toBeVisible();
      created = true;

      // --- Make it the default --------------------------------------------
      await rowFor(page, name)
        .getByRole("button", {
          name: copy.systems.setDefaultButton,
          exact: true,
        })
        .click();
      await expect(rowFor(page, name)).toContainText(copy.systems.defaultBadge);
      // The default cannot be deleted, so the panel does not offer it.
      await expect(
        rowFor(page, name).getByRole("button", {
          name: messages.common.form.delete,
          exact: true,
        })
      ).toHaveCount(0);

      // --- The moon's date re-labels in the new default -------------------
      if (setMoon) {
        await expect(moonLine(page)).toContainText(`2 ${abbrev}`);
      }
    } finally {
      // --- Restore: universal default, system deleted, moon cleared -------
      await gotoPanel(page);
      const universal = rowFor(page, copy.systems.universalBadge);
      const makeDefault = universal.getByRole("button", {
        name: copy.systems.setDefaultButton,
        exact: true,
      });
      if (await makeDefault.isVisible()) {
        await makeDefault.click();
      }
      await expect(universal).toContainText(copy.systems.defaultBadge);

      if (created) {
        await rowFor(page, name)
          .getByRole("button", {
            name: messages.common.form.delete,
            exact: true,
          })
          .click();
        const confirmDialog = page.getByRole("dialog");
        await confirmDialog
          .getByRole("button", {
            name: messages.common.form.delete,
            exact: true,
          })
          .click();
        await expect(rowFor(page, name)).toHaveCount(0);
      }

      if (setMoon) {
        await page
          .getByRole("button", { name: copy.moon.clearButton, exact: true })
          .click();
        await expect(page.getByText(copy.moon.notSet)).toBeVisible();
      }
    }
  });
});

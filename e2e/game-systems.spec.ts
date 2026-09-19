import { test, expect } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * SPEC-021 T1: `daggerheart` is a game system. Its dashboard home renders,
 * the world pages are shared, a 5e catalogue under it is a 404 (ADR-0013
 * rule 4), and the system switch (rule 6) is live.
 */
test.describe("the daggerheart system", () => {
  test("renders its dashboard home, without the 5e catalogues in the sidebar", async ({
    page,
  }) => {
    await page.goto("/dashboard/daggerheart");

    await expect(page.getByTestId("dashboard-page")).toBeVisible();
    const nav = page.getByRole("navigation", {
      name: messages.common.nav.sidebarLabel,
    });
    await expect(
      nav.getByRole("link", { name: messages.common.nav.geography })
    ).toHaveAttribute("href", "/dashboard/daggerheart/geography");
    await expect(
      nav.getByRole("link", { name: messages.common.nav.spells, exact: true })
    ).toHaveCount(0);
    await expect(
      page.getByText(messages.gameSystemCompatibility.daggerheart)
    ).toBeVisible();
  });

  test("keeps the world pages shared", async ({ page }) => {
    await page.goto("/dashboard/daggerheart/npc");

    await expect(
      page.getByText(messages.common.notFound.title)
    ).not.toBeVisible();
  });

  test("is a 404 for a 5e catalogue", async ({ page }) => {
    await page.goto("/dashboard/daggerheart/spells");

    await expect(page.getByText(messages.common.notFound.title)).toBeVisible();
  });

  test("the switch sends a 5e catalogue to Daggerheart's home", async ({
    page,
  }) => {
    await page.goto("/dashboard/dnd5e/spells");

    await page
      .getByRole("combobox", { name: messages.common.nav.gameSystem })
      .selectOption("daggerheart");

    await expect(page).toHaveURL(/\/dashboard\/daggerheart$/);
    await expect(page.getByTestId("dashboard-page")).toBeVisible();
  });
});

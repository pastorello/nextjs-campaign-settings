import { test, expect } from "@playwright/test";

import messages from "@/messages/it.json";

import {
  DAGGERHEART_FIXTURE_TIMEOUT,
  DH_ADMIN,
  createDaggerheartFixture,
  daggerheartFixtureNames,
  deleteDaggerheartFixture,
  rowFor,
} from "./helpers/daggerheart";

/**
 * SPEC-021 T8, the journey: a domain (two, since a class needs both), a
 * card in it, a class with a subclass whose features sit in two tiers —
 * then the class page, reached from the public class list, showing the
 * subclass's features by tier and the domain's card; search finding the
 * class under daggerheart only (T7); and everything deleted in reverse
 * order. Invented content only (SPEC-018 §5); `finally` removes whatever a
 * failure left.
 */
test.describe("Daggerheart class page", () => {
  test("domain → card → class with a subclass → the class page", async ({
    page,
  }) => {
    test.setTimeout(DAGGERHEART_FIXTURE_TIMEOUT);
    const names = daggerheartFixtureNames(Date.now());

    try {
      await createDaggerheartFixture(page, names);

      // --- From the public class list to the class page --------------------
      await page.goto(
        `/dashboard/daggerheart/classes?query=${encodeURIComponent(names.className)}`
      );
      await page
        .getByRole("link", { name: names.className, exact: true })
        .click();
      await expect(
        page.getByRole("heading", { level: 1, name: names.className })
      ).toBeVisible();
      await expect(
        page.getByText(messages.dhClasses.hopeFeature.cost)
      ).toBeVisible();

      // --- The subclass, its features by tier -------------------------------
      const subclass = page.getByRole("region", { name: names.subclass });
      await expect(subclass.getByRole("heading", { level: 4 })).toHaveText([
        messages.dhSubclasses.tiers.foundation,
        messages.dhSubclasses.tiers.mastery,
      ]);
      await expect(
        subclass.getByRole("heading", {
          level: 5,
          name: names.foundationFeature,
        })
      ).toBeVisible();
      await expect(
        subclass.getByRole("heading", { level: 5, name: names.masteryFeature })
      ).toBeVisible();

      // --- The domain's card, under its level --------------------------------
      const domainCards = page.getByRole("region", {
        name: messages.dhClasses.classPage.domainCards,
      });
      await expect(
        domainCards.getByRole("heading", {
          level: 3,
          name: messages.dhDomainCards.card.level.replace("{level}", "2"),
        })
      ).toBeVisible();
      await expect(
        domainCards.getByRole("article", { name: names.card })
      ).toBeVisible();

      // --- Search finds the class under daggerheart, not under dnd5e ---------
      await page.goto(
        `/dashboard/daggerheart/search?query=${encodeURIComponent(names.className)}`
      );
      await page
        .getByRole("link", { name: names.className, exact: true })
        .click();
      await page.waitForURL(/\/dashboard\/daggerheart\/classes\/\d+$/);
      await page.goto(
        `/dashboard/dnd5e/search?query=${encodeURIComponent(names.className)}`
      );
      await expect(
        page.getByText(
          messages.search.page.noMatches.replace("{term}", names.className)
        )
      ).toBeVisible();

      // --- Deleted in reverse order ------------------------------------------
      await deleteDaggerheartFixture(page, names);
      await page.goto(
        `${DH_ADMIN.domains}?query=${encodeURIComponent(names.domainA)}`
      );
      await page.waitForLoadState("networkidle");
      await expect(rowFor(page, names.domainA)).toHaveCount(0);
    } finally {
      await deleteDaggerheartFixture(page, names);
    }
  });
});

import { test, expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * SPEC-021 T2/T3: a Daggerheart domain with a colour, a card in it, the card
 * seen as a card view, then both deleted — the domain refused while its card
 * still uses it. Everything it writes is invented (SPEC-018 §5: no SRD
 * content in fixtures), and both rows are removed in `finally`, so a failed
 * assertion cannot leave them in the test database for the next spec.
 */
const ADMIN_DOMAINS = "/dashboard/daggerheart/admin/domains";
const ADMIN_CARDS = "/dashboard/daggerheart/admin/domain-cards";
const dh = messages.dhDomains;
const cards = messages.dhDomainCards;

const rowFor = (page: Page, name: string) =>
  page.getByRole("row").filter({ hasText: name });

/** A form's select, found by its label, set to the option named `option`. */
const pick = async (page: Page, label: string, option: string) => {
  await page
    .getByTestId("form-select")
    .filter({ has: page.getByText(label, { exact: true }) })
    .getByRole("button")
    .click();
  await page.getByRole("option", { name: option, exact: true }).click();
};

const gotoRow = async (page: Page, listUrl: string, name: string) => {
  await page.goto(`${listUrl}?query=${encodeURIComponent(name)}`);
  // Row buttons open client-side dialogs; a click that lands before
  // hydration is swallowed (seen on CI, 2026-09-18).
  await page.waitForLoadState("networkidle");
};

const deleteRow = async (page: Page, listUrl: string, name: string) => {
  await gotoRow(page, listUrl, name);
  const row = rowFor(page, name);
  if ((await row.count()) === 0) return;
  await row.getByRole("button", { name: messages.common.form.delete }).click();
  // Wait for the DELETE itself — refused or not — so the next navigation
  // cannot abort it.
  const deleted = page.waitForResponse(
    (response) =>
      response.url().includes("/api/") &&
      response.request().method() === "DELETE"
  );
  await page
    .getByRole("dialog")
    .getByRole("button", { name: messages.common.form.delete })
    .click();
  await deleted;
};

test.describe("Daggerheart domains and domain cards", () => {
  test("a domain with a colour, a card in it, its card view, and both deleted", async ({
    page,
  }) => {
    const stamp = Date.now();
    const domainName = `E2E Dominio ${stamp}`;
    const cardName = `E2E Carta ${stamp}`;

    try {
      // --- A domain, in violet -------------------------------------------
      await page.goto(ADMIN_DOMAINS);
      await page.waitForLoadState("networkidle");
      await page.getByRole("link", { name: dh.page.newItemButton }).click();
      await expect(
        page.getByRole("heading", { name: dh.form.createTitle })
      ).toBeVisible();
      await page.getByLabel(messages.common.fields.name.label).fill(domainName);
      await pick(page, dh.fields.colour.label, dh.colours.violet);
      await page.getByRole("button", { name: dh.form.createButton }).click();
      await page.waitForURL(`**${ADMIN_DOMAINS}`);

      // --- A level-3 card in it -------------------------------------------
      await page.goto(ADMIN_CARDS);
      await page.waitForLoadState("networkidle");
      await page.getByRole("link", { name: cards.page.newItemButton }).click();
      await expect(
        page.getByRole("heading", { name: cards.form.createTitle })
      ).toBeVisible();
      await page.getByLabel(messages.common.fields.name.label).fill(cardName);
      await pick(page, cards.fields.domainId.label, domainName);
      await pick(page, cards.fields.cardLevel.label, cards.levels.level3);
      await page
        .getByRole("textbox", { name: cards.fields.featureText.label })
        .click();
      await page.keyboard.type("Invented effect text for the test.");
      await page.getByRole("button", { name: cards.form.createButton }).click();
      await page.waitForURL(`**${ADMIN_CARDS}`);

      // --- The card view ---------------------------------------------------
      await page.goto(
        `/dashboard/daggerheart/domain-cards?query=${encodeURIComponent(cardName)}&view=cards`
      );
      const cardView = page.getByRole("article", { name: cardName });
      await expect(cardView).toBeVisible();
      await expect(cardView.getByText(domainName)).toBeVisible();
      await expect(
        cardView.getByText(cards.card.level.replace("{level}", "3"))
      ).toBeVisible();
      await expect(
        cardView.getByText("Invented effect text for the test.")
      ).toBeVisible();

      // --- A domain in use is refused ---------------------------------------
      await deleteRow(page, ADMIN_DOMAINS, domainName);
      await gotoRow(page, ADMIN_DOMAINS, domainName);
      await expect(rowFor(page, domainName)).toBeVisible();

      // --- Card first, then the domain goes ---------------------------------
      await deleteRow(page, ADMIN_CARDS, cardName);
      await expect(rowFor(page, cardName)).toHaveCount(0);
      await deleteRow(page, ADMIN_DOMAINS, domainName);
      await expect(rowFor(page, domainName)).toHaveCount(0);
    } finally {
      await deleteRow(page, ADMIN_CARDS, cardName);
      await deleteRow(page, ADMIN_DOMAINS, domainName);
    }
  });
});

import { test, expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * SPEC-021 T4/T5: two domains, a class of both with its first feature, a
 * second feature added and moved above the first inline, a subclass of the
 * class — then the class's delete refused while the subclass exists, and
 * everything deleted. Invented content only (SPEC-018 §5); every row is
 * removed in `finally`, so a failed assertion leaves nothing behind.
 */
const ADMIN_DOMAINS = "/dashboard/daggerheart/admin/domains";
const ADMIN_CLASSES = "/dashboard/daggerheart/admin/classes";
const ADMIN_SUBCLASSES = "/dashboard/daggerheart/admin/subclasses";
const domains = messages.dhDomains;
const classes = messages.dhClasses;
const subclasses = messages.dhSubclasses;
const feature = messages.dhFeature.fields;

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

/** A formatted-text field, typed into like a reader would. */
const typeRichText = async (page: Page, label: string, text: string) => {
  await page.getByRole("textbox", { name: label, exact: true }).click();
  await page.keyboard.type(text);
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

const createDomain = async (page: Page, name: string, colour: string) => {
  await page.goto(ADMIN_DOMAINS);
  await page.waitForLoadState("networkidle");
  await page.getByRole("link", { name: domains.page.newItemButton }).click();
  // Wait for the form: on the list, a non-exact "Nome" also matches the
  // name column's "Ordina per nome" sort button (CI, 2026-09-19).
  await expect(
    page.getByRole("heading", { name: domains.form.createTitle })
  ).toBeVisible();
  await page
    .getByLabel(messages.common.fields.name.label, { exact: true })
    .fill(name);
  await pick(page, domains.fields.colour.label, colour);
  await page.getByRole("button", { name: domains.form.createButton }).click();
  await page.waitForURL(`**${ADMIN_DOMAINS}`);
};

test.describe("Daggerheart classes and subclasses", () => {
  test("a class with features reordered inline, a subclass, and the delete order", async ({
    page,
  }) => {
    const stamp = Date.now();
    const domainA = `E2E Dominio A ${stamp}`;
    const domainB = `E2E Dominio B ${stamp}`;
    const className = `E2E Classe ${stamp}`;
    const subclassName = `E2E Sottoclasse ${stamp}`;

    try {
      await createDomain(page, domainA, domains.colours.violet);
      await createDomain(page, domainB, domains.colours.teal);

      // --- A class, created with its first feature -------------------------
      await page.goto(ADMIN_CLASSES);
      await page.waitForLoadState("networkidle");
      await page
        .getByRole("link", { name: classes.page.newItemButton })
        .click();
      await expect(
        page.getByRole("heading", { name: classes.form.createTitle })
      ).toBeVisible();
      await expect(page.getByText(classes.hopeFeature.cost)).toBeVisible();
      await page
        .getByLabel(messages.common.fields.name.label, { exact: true })
        .fill(className);
      await pick(page, classes.fields.domainAId.label, domainA);
      await pick(page, classes.fields.domainBId.label, domainB);
      await page
        .getByLabel(classes.fields.startingEvasion.label, { exact: true })
        .fill("9");
      await page
        .getByLabel(classes.fields.startingHp.label, { exact: true })
        .fill("6");
      await page
        .getByLabel(classes.fields.hopeFeatureName.label, { exact: true })
        .fill("Invented Spark");
      await typeRichText(
        page,
        classes.fields.hopeFeatureText.label,
        "An invented hope effect."
      );
      await page
        .getByLabel(feature.name.label, { exact: true })
        .fill("Invented First");
      await typeRichText(page, feature.text.label, "An invented feature.");
      await page
        .getByRole("button", { name: classes.form.createButton })
        .click();
      await page.waitForURL(`**${ADMIN_CLASSES}`);

      // --- A second feature, added and moved first inline -------------------
      await gotoRow(page, ADMIN_CLASSES, className);
      await expect(rowFor(page, className)).toContainText(domainA);
      await rowFor(page, className)
        .getByRole("button", {
          name: messages.common.table.editItem.replace("{name}", className),
        })
        .click();
      const featureList = page
        .getByRole("dialog")
        .getByRole("region", { name: classes.features.title });
      await featureList
        .getByRole("button", { name: classes.features.addButton })
        .click();
      await page
        .getByRole("dialog")
        .getByLabel(feature.name.label, { exact: true })
        .fill("Invented Second");
      await typeRichText(page, feature.text.label, "Another invented one.");
      await featureList
        .getByRole("button", { name: classes.features.saveButton })
        .click();
      const moveUp = featureList.getByRole("button", {
        name: classes.features.moveUp.replace("{name}", "Invented Second"),
      });
      await expect(moveUp).toBeEnabled();
      await moveUp.click();
      await expect(featureList.getByRole("listitem").first()).toContainText(
        "Invented Second"
      );

      // --- A subclass of the class ------------------------------------------
      await page.goto(ADMIN_SUBCLASSES);
      await page.waitForLoadState("networkidle");
      await page
        .getByRole("link", { name: subclasses.page.newItemButton })
        .click();
      await expect(
        page.getByRole("heading", { name: subclasses.form.createTitle })
      ).toBeVisible();
      await page
        .getByLabel(messages.common.fields.name.label, { exact: true })
        .fill(subclassName);
      await pick(page, subclasses.fields.classId.label, className);
      await pick(
        page,
        subclasses.fields.spellcastTrait.label,
        subclasses.spellcastTraits.instinct
      );
      await page
        .getByRole("button", { name: subclasses.form.createButton })
        .click();
      await page.waitForURL(`**${ADMIN_SUBCLASSES}`);
      await gotoRow(page, ADMIN_SUBCLASSES, subclassName);
      await expect(rowFor(page, subclassName)).toContainText(className);

      // --- The class's delete is refused while its subclass exists ----------
      await deleteRow(page, ADMIN_CLASSES, className);
      await gotoRow(page, ADMIN_CLASSES, className);
      await expect(rowFor(page, className)).toBeVisible();

      // --- Subclass, class, then the domains go ------------------------------
      await deleteRow(page, ADMIN_SUBCLASSES, subclassName);
      await deleteRow(page, ADMIN_CLASSES, className);
      await gotoRow(page, ADMIN_CLASSES, className);
      await expect(rowFor(page, className)).toHaveCount(0);
    } finally {
      await deleteRow(page, ADMIN_SUBCLASSES, subclassName);
      await deleteRow(page, ADMIN_CLASSES, className);
      await deleteRow(page, ADMIN_DOMAINS, domainA);
      await deleteRow(page, ADMIN_DOMAINS, domainB);
    }
  });
});

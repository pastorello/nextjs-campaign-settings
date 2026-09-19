import { expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * Builders for SPEC-021's Daggerheart fixtures, through the admin UI, for
 * the specs that need a whole chain — domain, card, class, subclass — before
 * they can look at anything (`daggerheart-class-page.spec.ts`,
 * `a11y.spec.ts`). Invented content only (SPEC-018 §5); every caller removes
 * what it built in `finally`, in reverse order (`deleteDaggerheartFixture`).
 */
export const DH_ADMIN = {
  domains: "/dashboard/daggerheart/admin/domains",
  cards: "/dashboard/daggerheart/admin/domain-cards",
  classes: "/dashboard/daggerheart/admin/classes",
  subclasses: "/dashboard/daggerheart/admin/subclasses",
} as const;

const domains = messages.dhDomains;
const cards = messages.dhDomainCards;
const classes = messages.dhClasses;
const subclasses = messages.dhSubclasses;
const feature = messages.dhFeature.fields;
const nameLabel = messages.common.fields.name.label;

export const rowFor = (page: Page, name: string) =>
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

/** Deletes the row named `name`, if there is one; waits for the DELETE. */
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

/** Opens a list's "new" form and waits for it (see the classes spec). */
const openNewForm = async (
  page: Page,
  listUrl: string,
  newButton: string,
  createTitle: string
) => {
  // The "new" button is a plain link: it works before hydration, so no
  // networkidle wait here.
  await page.goto(listUrl);
  await page.getByRole("link", { name: newButton }).click();
  await expect(page.getByRole("heading", { name: createTitle })).toBeVisible();
};

/** The names of one invented chain; `stamp` keeps parallel runs apart. */
export const daggerheartFixtureNames = (stamp: number) => ({
  domainA: `E2E Dominio A ${stamp}`,
  domainB: `E2E Dominio B ${stamp}`,
  card: `E2E Carta ${stamp}`,
  className: `E2E Classe ${stamp}`,
  subclass: `E2E Sottoclasse ${stamp}`,
  foundationFeature: `E2E Fondamento ${stamp}`,
  masteryFeature: `E2E Maestria ${stamp}`,
});

export type DaggerheartFixtureNames = ReturnType<
  typeof daggerheartFixtureNames
>;

/**
 * Two domains, a level-2 card in the first, a class of both domains, and a
 * subclass of it with one foundation and one mastery feature.
 */
export async function createDaggerheartFixture(
  page: Page,
  names: DaggerheartFixtureNames
) {
  for (const [name, colour] of [
    [names.domainA, domains.colours.violet],
    [names.domainB, domains.colours.teal],
  ] as const) {
    await openNewForm(
      page,
      DH_ADMIN.domains,
      domains.page.newItemButton,
      domains.form.createTitle
    );
    await page.getByLabel(nameLabel, { exact: true }).fill(name);
    await pick(page, domains.fields.colour.label, colour);
    await page.getByRole("button", { name: domains.form.createButton }).click();
    await page.waitForURL(`**${DH_ADMIN.domains}`);
  }

  await openNewForm(
    page,
    DH_ADMIN.cards,
    cards.page.newItemButton,
    cards.form.createTitle
  );
  await page.getByLabel(nameLabel, { exact: true }).fill(names.card);
  await pick(page, cards.fields.domainId.label, names.domainA);
  await pick(page, cards.fields.cardLevel.label, cards.levels.level2);
  await typeRichText(page, cards.fields.featureText.label, "Invented card.");
  await page.getByRole("button", { name: cards.form.createButton }).click();
  await page.waitForURL(`**${DH_ADMIN.cards}`);

  await openNewForm(
    page,
    DH_ADMIN.classes,
    classes.page.newItemButton,
    classes.form.createTitle
  );
  await page.getByLabel(nameLabel, { exact: true }).fill(names.className);
  await pick(page, classes.fields.domainAId.label, names.domainA);
  await pick(page, classes.fields.domainBId.label, names.domainB);
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
  await page.getByRole("button", { name: classes.form.createButton }).click();
  await page.waitForURL(`**${DH_ADMIN.classes}`);

  await openNewForm(
    page,
    DH_ADMIN.subclasses,
    subclasses.page.newItemButton,
    subclasses.form.createTitle
  );
  await page.getByLabel(nameLabel, { exact: true }).fill(names.subclass);
  await pick(page, subclasses.fields.classId.label, names.className);
  await pick(
    page,
    subclasses.fields.spellcastTrait.label,
    subclasses.spellcastTraits.instinct
  );
  await page
    .getByRole("button", { name: subclasses.form.createButton })
    .click();
  await page.waitForURL(`**${DH_ADMIN.subclasses}`);

  // The subclass's features, added inline in its edit dialog (ADR-0011).
  await gotoRow(page, DH_ADMIN.subclasses, names.subclass);
  await rowFor(page, names.subclass)
    .getByRole("button", {
      name: messages.common.table.editItem.replace("{name}", names.subclass),
    })
    .click();
  const featureList = page
    .getByRole("dialog")
    .getByRole("region", { name: subclasses.features.title });
  for (const [tier, name] of [
    [subclasses.tiers.foundation, names.foundationFeature],
    [subclasses.tiers.mastery, names.masteryFeature],
  ] as const) {
    await featureList
      .getByRole("button", {
        name: subclasses.features.addToTier.replace("{tier}", tier),
      })
      .click();
    await featureList
      .getByLabel(feature.name.label, { exact: true })
      .fill(name);
    await featureList
      .getByRole("textbox", { name: feature.text.label, exact: true })
      .click();
    await page.keyboard.type("An invented subclass feature.");
    await featureList
      .getByRole("button", { name: subclasses.features.saveButton })
      .click();
    await expect(featureList.getByText(name, { exact: true })).toBeVisible();
  }
}

/**
 * The time a fixture-building test needs. Building the chain takes five
 * forms and an inline dialog, and each first visit to a route compiles it on
 * the dev server: on CI (2026-09-19) the body alone took ~29 s, so the 30 s
 * default expired during the clean-up.
 */
export const DAGGERHEART_FIXTURE_TIMEOUT = 120_000;

/**
 * Removes a fixture in reverse order; safe on a partly built one, and on a
 * page a failure has closed — the clean-up then opens a fresh page in the
 * same (authenticated) context.
 */
export async function deleteDaggerheartFixture(
  givenPage: Page,
  names: DaggerheartFixtureNames
) {
  const page = givenPage.isClosed()
    ? await givenPage.context().newPage()
    : givenPage;
  await deleteRow(page, DH_ADMIN.subclasses, names.subclass);
  await deleteRow(page, DH_ADMIN.classes, names.className);
  await deleteRow(page, DH_ADMIN.cards, names.card);
  await deleteRow(page, DH_ADMIN.domains, names.domainA);
  await deleteRow(page, DH_ADMIN.domains, names.domainB);
}

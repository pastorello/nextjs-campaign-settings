import { test, expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * SPEC-027 T3: a Daggerheart community tied to a place and a faction. Its
 * card names both as links, the faction's card under Daggerheart names the
 * community back, and deleting the community leaves the faction. Everything
 * it writes is invented (SPEC-018 §5), and removed in `finally`.
 */
const ADMIN = "/dashboard/daggerheart/admin/communities";
const t = messages.dhCommunities;

const rowFor = (page: Page, name: string) =>
  page.getByRole("row").filter({ hasText: name });

const deleteRow = async (page: Page, listUrl: string, name: string) => {
  await page.goto(`${listUrl}?query=${encodeURIComponent(name)}`);
  await page.waitForLoadState("networkidle");
  const row = rowFor(page, name);
  if ((await row.count()) === 0) return;
  await row.getByRole("button", { name: messages.common.form.delete }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: messages.common.form.delete })
    .click();
  await expect(row).toHaveCount(0);
};

/** Opens a multiselect by its label and picks an option; returns its text. */
const pickFrom = async (page: Page, label: string, option?: string) => {
  await page.getByRole("button", { name: label }).click();
  const choice = option
    ? page.getByRole("option", { name: option, exact: true })
    : page.getByRole("option").first();
  const text = (await choice.innerText()).trim();
  await choice.click();
  await page.keyboard.press("Escape");
  return text;
};

test.describe("Daggerheart communities", () => {
  test("a community tied to a place and a faction, seen from both sides", async ({
    page,
  }) => {
    const stamp = Date.now();
    const faction = `E2E Fazione ${stamp}`;
    const community = `E2E Comunità ${stamp}`;

    try {
      // --- A faction to tie it to ------------------------------------------
      await page.goto("/dashboard/dnd5e/admin/factions/new");
      await page.getByLabel(messages.common.fields.name.label).fill(faction);
      await page
        .getByRole("button", { name: messages.factions.form.createButton })
        .click();
      await page.waitForURL("**/dashboard/dnd5e/admin/factions");

      // --- The community ----------------------------------------------------
      await page.goto(`${ADMIN}/new`);
      await page.waitForLoadState("networkidle");
      await page.getByLabel(messages.common.fields.name.label).fill(community);
      await page
        .getByLabel(t.fields.adjectives.label, { exact: true })
        .fill("patient, wry");
      await page
        .getByLabel(t.fields.featureName.label, { exact: true })
        .fill("Invented memory");
      await page
        .getByRole("textbox", { name: t.fields.featureText.label })
        .click();
      await page.keyboard.type("Invented feature text.");
      const place = await pickFrom(page, t.fields.placeIds.label);
      await pickFrom(page, t.fields.factionIds.label, faction);
      await page.getByRole("button", { name: t.form.createButton }).click();
      await page.waitForURL(`**${ADMIN}`);

      // --- Its card names the place and the faction -------------------------
      await page.goto(
        `/dashboard/daggerheart/communities?query=${encodeURIComponent(community)}&view=cards`
      );
      const card = page.getByRole("article", { name: community });
      await expect(card.getByText("patient, wry")).toBeVisible();
      await expect(card.getByRole("link", { name: place })).toBeVisible();
      await expect(card.getByRole("link", { name: faction })).toBeVisible();

      // --- The faction's card names it back, under Daggerheart only ---------
      await page.goto(
        `/dashboard/daggerheart/factions?query=${encodeURIComponent(faction)}`
      );
      await page.getByRole("button", { name: new RegExp(faction) }).click();
      await expect(page.getByRole("link", { name: community })).toBeVisible();
      await page.goto(
        `/dashboard/dnd5e/factions?query=${encodeURIComponent(faction)}`
      );
      await page.getByRole("button", { name: new RegExp(faction) }).click();
      await expect(page.getByRole("link", { name: community })).toHaveCount(0);

      // --- Deleting the community keeps the faction -------------------------
      await deleteRow(page, ADMIN, community);
      await page.goto(
        `/dashboard/dnd5e/admin/factions?query=${encodeURIComponent(faction)}`
      );
      await expect(rowFor(page, faction)).toBeVisible();
    } finally {
      await deleteRow(page, ADMIN, community);
      await deleteRow(page, "/dashboard/dnd5e/admin/factions", faction);
    }
  });
});

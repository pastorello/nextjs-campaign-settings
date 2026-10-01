import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import messages from "@/messages/it.json";

import {
  addPlayerToCampaign,
  createPlayerAccount,
  deleteAccountIfPresent,
  signIn,
  signedOutPage,
} from "./helpers/accounts";
import { ensureCampaign } from "./helpers/ensureCampaign";
import { chooseFromContextMenu } from "./helpers/mapContextMenu";

const t = messages.geography;
const revealedTo = messages.common.fields.revealedTo.label;

async function openMap(page: Page, system: "dnd5e" | "daggerheart") {
  await page.goto(`/dashboard/${system}/geography`);
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(300);
}

/** Ticks or unticks one campaign in the reveal dialog that is open. */
async function setRevealed(page: Page, campaign: string, revealed: boolean) {
  const box = page.getByRole("checkbox", { name: campaign, exact: true });
  await box.setChecked(revealed);
  await expect(box).toBeChecked({ checked: revealed });
  await page
    .getByRole("dialog")
    .filter({ has: box })
    .getByRole("button", { name: t.revealDialog.close, exact: true })
    .click();
}

async function revealRoot(page: Page, campaign: string, revealed: boolean) {
  await openMap(page, "dnd5e");
  await page.getByRole("button", { name: t.mapOptions.trigger }).click();
  await page.getByRole("button", { name: t.popover.reveal }).click();
  await setRevealed(page, campaign, revealed);
}

async function openPopover(page: Page, title: string) {
  const popover = page.getByRole("dialog", { name: title, exact: true });
  await expect(async () => {
    await page.getByRole("button", { name: title, exact: true }).click();
    await expect(popover).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 10_000 });
  return popover;
}

async function addLandmark(page: Page, title: string) {
  await chooseFromContextMenu(
    page,
    { x: 440, y: 280 },
    t.contextMenu.addPlace.trigger
  );
  await page.getByPlaceholder(t.poiPanel.placeholders.placeName).fill(title);
  await page.getByRole("button", { name: t.poiPanel.save.save }).click();
  await page
    .getByRole("button", { name: t.poiPanel.close, exact: true })
    .click();
  await expect(
    page.getByRole("button", { name: title, exact: true })
  ).toBeVisible();
}

async function deleteLandmark(page: Page, title: string) {
  await openMap(page, "dnd5e");
  const marker = page.getByRole("button", { name: title, exact: true });
  if (!(await marker.count())) return;
  const popover = await openPopover(page, title);
  await popover
    .getByRole("button", { name: t.popover.remove, exact: true })
    .click();
  await page
    .getByRole("radio", { name: t.removeLandmark.outcomes.deleteLabel })
    .click();
  await page.getByRole("button", { name: t.removeLandmark.confirm }).click();
  await expect(marker).toHaveCount(0);
}

async function deleteNpcIfPresent(page: Page, name: string) {
  await page.goto(
    `/dashboard/dnd5e/admin/npc?query=${encodeURIComponent(name)}`
  );
  await page.waitForLoadState("networkidle");
  const row = page.getByRole("row").filter({ hasText: name });
  if (!(await row.count())) return;
  await row.getByRole("button", { name: messages.common.form.delete }).click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: messages.common.form.delete })
    .click();
  await expect(row).toHaveCount(0);
}

/**
 * SPEC-022 T9: the DM reveals a place to one of two campaigns and an NPC to
 * the other; a player in both switches between them and sees each
 * campaign's share, and nothing of the other's.
 */
test("a player in two campaigns switches between them and sees each one's share", async ({
  page,
  browser,
}) => {
  test.slow();
  const stamp = Date.now();
  const name = `E2E Journey Player ${stamp}`;
  const email = `e2e-journey-${stamp}@example.test`;
  const password = "journey secret";
  const landmark = `E2E journey landmark ${stamp}`;
  const npc = `E2E journey NPC ${stamp}`;

  const fiveE = await ensureCampaign(page, "dnd5e");
  const daggerheart = await ensureCampaign(page, "daggerheart");
  await createPlayerAccount(page, { name, email, password });
  await addPlayerToCampaign(page, name, "dnd5e");
  await addPlayerToCampaign(page, name, "daggerheart");

  // The place goes to the 5e campaign: the root, then a landmark on it.
  await revealRoot(page, fiveE, true);
  await addLandmark(page, landmark);
  const popover = await openPopover(page, landmark);
  await popover.getByRole("button", { name: t.popover.reveal }).click();
  await setRevealed(page, fiveE, true);
  await page.keyboard.press("Escape");

  // The NPC goes to the Daggerheart campaign.
  await page.goto("/dashboard/dnd5e/admin/npc/new");
  await page.getByLabel(messages.common.fields.name.label).fill(npc);
  await page.getByRole("button", { name: revealedTo }).click();
  await page.getByRole("option", { name: daggerheart }).click();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: messages.npc.form.createButton })
    .click();
  await page.waitForURL("**/dashboard/dnd5e/admin/npc");

  const player = await signedOutPage(browser);
  try {
    await signIn(player, email, password);
    await expect(player).toHaveURL(/\/dashboard\/(dnd5e|daggerheart)$/);
    const selector = player.getByRole("combobox", {
      name: messages.common.nav.campaignSelector,
    });
    await expect(selector).toBeVisible();

    // The sidebar, with the campaign selector, passes an axe scan.
    await player.waitForLoadState("networkidle");
    const scan = await new AxeBuilder({ page: player })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .analyze();
    expect(scan.violations.map((violation) => violation.id)).toEqual([]);

    // The 5e campaign: the landmark, not the NPC.
    await selector.selectOption({ label: fiveE });
    await player.waitForURL("**/dashboard/dnd5e/geography");
    await expect(
      player.getByRole("button", { name: landmark, exact: true })
    ).toBeVisible();
    await player.goto(
      `/dashboard/dnd5e/npc?query=${encodeURIComponent(String(stamp))}`
    );
    expect(await player.content()).not.toContain(npc);

    // The Daggerheart campaign: the NPC, and no place at all.
    await player
      .getByRole("combobox", { name: messages.common.nav.campaignSelector })
      .selectOption({ label: daggerheart });
    await player.waitForURL("**/dashboard/daggerheart/geography");
    await expect(
      player.getByText(
        t.player.nothingRevealed.replace("{campaign}", daggerheart)
      )
    ).toBeVisible();
    expect(await player.content()).not.toContain(landmark);
    await player.goto(
      `/dashboard/daggerheart/npc?query=${encodeURIComponent(String(stamp))}`
    );
    await expect(player.getByText(npc, { exact: true })).toBeVisible();
  } finally {
    await player.context().close();
    await revealRoot(page, fiveE, false);
    await deleteLandmark(page, landmark);
    await deleteNpcIfPresent(page, npc);
    await deleteAccountIfPresent(page, name);
  }
});

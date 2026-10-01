import { test, expect, type Page } from "@playwright/test";

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

async function openMap(page: Page) {
  await page.goto("/dashboard/dnd5e/geography");
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(300);
}

/** A landmark on the map in view, through the context menu. */
async function addLandmark(
  page: Page,
  title: string,
  at: { x: number; y: number }
) {
  const marker = page.getByRole("button", { name: title, exact: true });
  await chooseFromContextMenu(page, at, t.contextMenu.addPlace.trigger);
  await page.getByPlaceholder(t.poiPanel.placeholders.placeName).fill(title);
  await page.getByRole("button", { name: t.poiPanel.save.save }).click();
  await page
    .getByRole("button", { name: t.poiPanel.close, exact: true })
    .click();
  await expect(marker).toBeVisible();
}

/** Opens a landmark's popover; a click before the map settles is retried. */
async function openPopover(page: Page, title: string) {
  const popover = page.getByRole("dialog", { name: title, exact: true });
  await expect(async () => {
    await page.getByRole("button", { name: title, exact: true }).click();
    await expect(popover).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 10_000 });
  return popover;
}

/** Ticks or unticks one campaign in the reveal dialog that is open. */
async function setRevealed(page: Page, campaign: string, revealed: boolean) {
  const box = page.getByRole("checkbox", { name: campaign, exact: true });
  await box.setChecked(revealed);
  await expect(box).toBeChecked({ checked: revealed });
  await page.getByRole("button", { name: t.revealDialog.close }).click();
}

/** The root map's own reveal, from the map options menu (SPEC-022 T7). */
async function revealRoot(page: Page, campaign: string, revealed: boolean) {
  await openMap(page);
  await page.getByRole("button", { name: t.mapOptions.trigger }).click();
  await page.getByRole("button", { name: t.popover.reveal }).click();
  await setRevealed(page, campaign, revealed);
}

async function deleteLandmark(page: Page, title: string) {
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

/**
 * SPEC-022 T7 (R8, R11): a player's map holds what their campaign has been
 * shown, read only. Nothing is shown until the root is revealed; then a
 * revealed landmark appears and a hidden one does not.
 */
test("a player sees the places revealed to their campaign, and nothing else", async ({
  page,
  browser,
}) => {
  test.slow();
  const stamp = Date.now();
  const name = `E2E Map Player ${stamp}`;
  const email = `e2e-map-player-${stamp}@example.test`;
  const password = "map secret";
  const shown = `E2E shown ${stamp}`;
  const hidden = `E2E hidden ${stamp}`;

  const campaign = await ensureCampaign(page);
  await createPlayerAccount(page, { name, email, password });
  await addPlayerToCampaign(page, name);

  await openMap(page);
  const mapImage = await page
    .locator("img.leaflet-image-layer")
    .first()
    .getAttribute("src");
  expect(mapImage).toMatch(/^\/api\/maps\/.+\/image$/);
  await addLandmark(page, shown, { x: 420, y: 260 });
  await addLandmark(page, hidden, { x: 520, y: 320 });
  const shownPopover = await openPopover(page, shown);
  await shownPopover.getByRole("button", { name: t.popover.reveal }).click();
  await setRevealed(page, campaign, true);
  await page.keyboard.press("Escape");

  const player = await signedOutPage(browser);
  try {
    // The root is revealed to nobody yet: nothing to see, not even the
    // root's map image.
    await signIn(player, email, password);
    await expect(player).toHaveURL(/\/dashboard\/dnd5e\/geography/);
    await expect(
      player.getByText(t.player.nothingRevealed.replace("{campaign}", campaign))
    ).toBeVisible();
    expect((await player.request.get(mapImage!)).status()).toBe(404);

    await revealRoot(page, campaign, true);

    await openMap(player);
    await expect(
      player.getByRole("button", { name: shown, exact: true })
    ).toBeVisible();
    await expect(
      player.getByRole("button", { name: hidden, exact: true })
    ).toHaveCount(0);
    expect((await player.request.get(mapImage!)).status()).toBe(200);

    // Read only: no options menu, and a popover that changes nothing.
    await expect(
      player.getByRole("button", { name: t.mapOptions.trigger })
    ).toHaveCount(0);
    const popover = await openPopover(player, shown);
    await expect(
      popover.getByRole("button", { name: t.popover.reveal })
    ).toHaveCount(0);
    await expect(
      popover.getByRole("button", { name: t.popover.remove, exact: true })
    ).toHaveCount(0);

    // A deep link to a place the campaign cannot see is a 404.
    const missing = await player.goto(
      "/dashboard/dnd5e/geography?place=999999999"
    );
    expect(missing?.status()).toBe(404);
  } finally {
    await player.context().close();
    await revealRoot(page, campaign, false);
    await deleteLandmark(page, shown);
    await deleteLandmark(page, hidden);
    await deleteAccountIfPresent(page, name);
  }
});

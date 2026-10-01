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

const revealedTo = messages.common.fields.revealedTo.label;

/** Creates an NPC from the admin form, revealed to `campaign` or to none. */
async function createNpc(page: Page, name: string, campaign: string | null) {
  await page.goto("/dashboard/dnd5e/admin/npc/new");
  await page.getByLabel(messages.common.fields.name.label).fill(name);
  if (campaign !== null) {
    await page.getByRole("button", { name: revealedTo }).click();
    await page.getByRole("option", { name: campaign }).click();
    await page.keyboard.press("Escape");
  }
  await page
    .getByRole("button", { name: messages.npc.form.createButton })
    .click();
  await page.waitForURL("**/dashboard/dnd5e/admin/npc");
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
 * SPEC-022 T8b (R2): a player's NPC list holds the NPCs revealed to their
 * campaign. A hidden one is absent from the page and from its payload, and
 * the card offers no DM action.
 */
test("a player sees the NPCs revealed to their campaign, and not the others", async ({
  page,
  browser,
}) => {
  test.slow();
  const stamp = Date.now();
  const name = `E2E Records Player ${stamp}`;
  const email = `e2e-records-player-${stamp}@example.test`;
  const password = "records secret";
  const shown = `E2E shown NPC ${stamp}`;
  const hidden = `E2E hidden NPC ${stamp}`;

  const campaign = await ensureCampaign(page);
  await createPlayerAccount(page, { name, email, password });
  await addPlayerToCampaign(page, name);
  await createNpc(page, shown, campaign);
  await createNpc(page, hidden, null);

  const player = await signedOutPage(browser);
  try {
    await signIn(player, email, password);
    await expect(player).toHaveURL(/\/dashboard\/dnd5e$/);

    const response = await player.goto(
      `/dashboard/dnd5e/npc?query=${encodeURIComponent(`E2E`)}`
    );
    expect(response?.status()).toBe(200);
    await expect(player.getByText(shown, { exact: true })).toBeVisible();
    await expect(player.getByText(hidden, { exact: true })).toHaveCount(0);
    expect(await player.content()).not.toContain(hidden);

    // The search finds the one the campaign was shown, and not the other
    // (R10, T8c).
    await player.goto(
      `/dashboard/dnd5e/search?query=${encodeURIComponent(String(stamp))}`
    );
    await expect(player.getByText(shown, { exact: true })).toBeVisible();
    expect(await player.content()).not.toContain(hidden);
    await player.goto(
      `/dashboard/dnd5e/npc?query=${encodeURIComponent(`E2E`)}`
    );

    // A player reads where an NPC is; assigning it is the DM's.
    await expect(
      player.getByRole("button", {
        name: messages.common.location.unknown,
      })
    ).toHaveCount(0);

    // The admin list stays the DM's.
    const admin = await player.goto("/dashboard/dnd5e/admin/npc");
    expect(admin?.status()).toBe(403);
  } finally {
    await player.context().close();
    await deleteNpcIfPresent(page, shown);
    await deleteNpcIfPresent(page, hidden);
    await deleteAccountIfPresent(page, name);
  }
});

import { test, expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

import { ensureCampaign } from "./helpers/ensureCampaign";

const revealedTo = messages.common.fields.revealedTo.label;

const gotoNpc = async (page: Page, name: string) => {
  await page.goto(
    `/dashboard/dnd5e/admin/npc?query=${encodeURIComponent(name)}`
  );
  // Row buttons open client-side dialogs; a click that lands before
  // hydration is swallowed (seen on CI, 2026-09-18).
  await page.waitForLoadState("networkidle");
};

const rowFor = (page: Page, name: string) =>
  page.getByRole("row").filter({ hasText: name });

/**
 * SPEC-022 T6: the DM reveals a record to a campaign from its form, and the
 * admin list says to whom. What a player then sees is T7/T8's.
 */
test("an NPC is revealed to a campaign, and hidden again", async ({ page }) => {
  await ensureCampaign(page);
  const name = `E2E Reveal ${Date.now()}`;

  await page.goto("/dashboard/dnd5e/admin/npc/new");
  await page.getByLabel(messages.common.fields.name.label).fill(name);
  await page.getByRole("button", { name: revealedTo }).click();
  const option = page.getByRole("option").first();
  const campaign = (await option.innerText()).trim();
  await option.click();
  await page.keyboard.press("Escape");
  await page
    .getByRole("button", { name: messages.npc.form.createButton })
    .click();
  await page.waitForURL("**/dashboard/dnd5e/admin/npc");

  try {
    await gotoNpc(page, name);
    await expect(rowFor(page, name)).toContainText(campaign);

    await rowFor(page, name)
      .getByRole("button", { name: messages.common.table.edit })
      .click();
    const dialog = page.getByRole("dialog");
    await dialog.getByRole("button", { name: revealedTo }).click();
    await page.getByRole("option", { name: campaign }).click();
    await page.keyboard.press("Escape");
    await dialog
      .getByRole("button", { name: messages.npc.form.editButton })
      .click();
    await expect(dialog).toHaveCount(0);

    await gotoNpc(page, name);
    await expect(rowFor(page, name)).not.toContainText(campaign);
  } finally {
    await gotoNpc(page, name);
    const row = rowFor(page, name);
    if (await row.count()) {
      await row
        .getByRole("button", { name: messages.common.form.delete })
        .click();
      await page
        .getByRole("dialog")
        .getByRole("button", { name: messages.common.form.delete })
        .click();
      await expect(row).toHaveCount(0);
    }
  }
});

import { expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * Creates the dnd5e campaign if the test database has none, and returns its
 * title. The campaign has no delete (SPEC-013 T6), so it stays for later
 * runs, which reuse it.
 * Shared by the campaign calendar's CRUD spec and the a11y scan
 * (SPEC-014 T9).
 */
export async function ensureCampaign(page: Page): Promise<string> {
  await page.goto("/dashboard/dnd5e/campaign");
  // The create button is client-side; a click that lands before hydration
  // is swallowed (seen on CI, 2026-09-18).
  await page.waitForLoadState("networkidle");
  const create = page.getByRole("button", {
    name: messages.campaign.form.createButton,
  });
  if (await create.isVisible().catch(() => false)) {
    await page
      .getByLabel(messages.campaign.fields.title.label, { exact: true })
      .fill(`E2E Campagna ${Date.now()}`);
    await create.click();
    await expect(create).toBeHidden();
  }

  // Its title, which the reveal controls label a campaign by (SPEC-022).
  const title = page.getByRole("heading", { level: 1 }).first();
  await expect(title).toBeVisible();
  return (await title.innerText()).trim();
}

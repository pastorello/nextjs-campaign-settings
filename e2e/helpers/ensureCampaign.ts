import { expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * Creates the dnd5e campaign if the test database has none. The campaign
 * has no delete (SPEC-013 T6), so it stays for later runs, which reuse it.
 * Shared by the campaign calendar's CRUD spec and the a11y scan
 * (SPEC-014 T9).
 */
export async function ensureCampaign(page: Page) {
  await page.goto("/dashboard/dnd5e/campaign");
  // The create button is client-side; a click that lands before hydration
  // is swallowed (seen on CI, 2026-09-18).
  await page.waitForLoadState("networkidle");
  const create = page.getByRole("button", {
    name: messages.campaign.form.createButton,
  });
  if (!(await create.isVisible().catch(() => false))) return;

  await page
    .getByLabel(messages.campaign.fields.title.label, { exact: true })
    .fill(`E2E Campagna ${Date.now()}`);
  await create.click();
  await expect(create).toBeHidden();
}

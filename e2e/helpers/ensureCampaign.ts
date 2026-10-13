import { expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

type System = "dnd5e" | "daggerheart";

/**
 * Opens `system`'s oldest campaign, creating one if the test database has
 * none, and returns its page's path — `/dashboard/<system>/campaign/<id>`
 * (SPEC-032 §5.2). The campaign has no delete before SPEC-032 T4, so it
 * stays for later runs, which reuse it. The page is left open.
 */
export async function ensureCampaignPath(
  page: Page,
  system: System = "dnd5e"
): Promise<string> {
  await page.goto(`/dashboard/${system}/campaign`);
  // The create button is client-side; a click that lands before hydration
  // is swallowed (seen on CI, 2026-09-18).
  await page.waitForLoadState("networkidle");

  const firstCard = page.getByTestId("campaign-list").getByRole("link").first();
  if (await firstCard.isVisible().catch(() => false)) {
    await firstCard.click();
  } else {
    await page
      .getByLabel(messages.campaign.fields.title.label, { exact: true })
      .fill(`E2E Campagna ${system} ${Date.now()}`);
    await page
      .getByRole("button", { name: messages.campaign.form.createButton })
      .click();
  }

  await page.waitForURL(new RegExp(`/dashboard/${system}/campaign/\\d+$`));
  await page.waitForLoadState("networkidle");
  return new URL(page.url()).pathname;
}

/**
 * Opens (creating if need be) `system`'s campaign and returns its title,
 * which the reveal controls label a campaign by (SPEC-022). Shared by the
 * campaign calendar's CRUD spec and the a11y scan (SPEC-014 T9).
 */
export async function ensureCampaign(
  page: Page,
  system: System = "dnd5e"
): Promise<string> {
  await ensureCampaignPath(page, system);

  const title = page.getByRole("heading", { level: 1 }).first();
  await expect(title).toBeVisible();
  return (await title.innerText()).trim();
}

import { test, expect } from "@playwright/test";

import messages from "@/messages/it.json";

import {
  createPlayerAccount,
  deleteAccountIfPresent,
  fillTemplate,
} from "./helpers/accounts";
import { ensureCampaign } from "./helpers/ensureCampaign";

const t = messages.campaign.players;

/** SPEC-022 T5: a campaign's group is its players. */
test("the DM adds a player to the campaign and takes them out again", async ({
  page,
}) => {
  const stamp = Date.now();
  const name = `E2E Group Player ${stamp}`;
  await ensureCampaign(page);
  await createPlayerAccount(page, {
    name,
    email: `e2e-group-${stamp}@example.test`,
    password: "group secret",
  });

  try {
    await page.goto("/dashboard/dnd5e/campaign");
    const section = page.getByRole("region", { name: t.title });
    await section.getByRole("button", { name: t.candidate }).click();
    await page.getByRole("option", { name }).click();
    await section.getByRole("button", { name: t.add }).click();

    const remove = section.getByRole("button", {
      name: fillTemplate(t.remove, { name }),
    });
    await expect(remove).toBeVisible();
    await page.reload();
    await expect(remove).toBeVisible();

    await remove.click();
    await expect(remove).toHaveCount(0);
  } finally {
    await deleteAccountIfPresent(page, name);
  }
});

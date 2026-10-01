import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import messages from "@/messages/it.json";

import { ensureCampaign } from "./helpers/ensureCampaign";
import { chooseFromContextMenu } from "./helpers/mapContextMenu";

const t = messages.geography;

/**
 * SPEC-022 T6b: a landmark is revealed to a campaign from its popover. Under
 * a root that campaign has not been shown, the dialog names the root as
 * what still hides it.
 */
test("a landmark is revealed to a campaign from the map, and hidden again", async ({
  page,
}) => {
  await ensureCampaign(page);
  const title = `E2E reveal landmark ${Date.now()}`;

  await page.goto("/dashboard/dnd5e/geography");
  await expect(page.locator(".leaflet-container")).toBeVisible();
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(300);
  const markers = page.locator(".custom-poi-marker");
  const baseline = await markers.count();

  await chooseFromContextMenu(
    page,
    { x: 420, y: 260 },
    t.contextMenu.addPlace.trigger
  );
  await page.getByPlaceholder(t.poiPanel.placeholders.placeName).fill(title);
  await page.getByRole("button", { name: t.poiPanel.save.save }).click();
  await page
    .getByRole("button", { name: t.poiPanel.close, exact: true })
    .click();
  await expect(markers).toHaveCount(baseline + 1);

  const popover = page.getByRole("dialog", { name: title, exact: true });
  const openPopover = async () => {
    await expect(async () => {
      await markers.last().click();
      await expect(popover).toBeVisible({ timeout: 500 });
    }).toPass({ timeout: 10_000 });
  };

  try {
    await openPopover();
    await popover.getByRole("button", { name: t.popover.reveal }).click();
    const dialog = page.getByRole("dialog", {
      name: t.revealDialog.title.replace("{title}", title),
    });
    const box = dialog.getByRole("checkbox").first();
    await expect(box).not.toBeChecked();
    const scan = await new AxeBuilder({ page })
      .include('[role="dialog"]')
      .analyze();
    expect(scan.violations).toEqual([]);

    await box.check();
    await expect(box).toBeChecked();
    // The E2E world's root is revealed to nobody, so it still hides the
    // landmark from that campaign; the hint says so.
    await expect(dialog).toContainText(
      t.revealDialog.hiddenBy.split("«")[0]!.trim()
    );

    await box.uncheck();
    await expect(box).not.toBeChecked();
    await dialog.getByRole("button", { name: t.revealDialog.close }).click();
  } finally {
    await page.keyboard.press("Escape");
    await openPopover();
    await popover
      .getByRole("button", { name: t.popover.remove, exact: true })
      .click();
    await page
      .getByRole("radio", { name: t.removeLandmark.outcomes.deleteLabel })
      .click();
    await page.getByRole("button", { name: t.removeLandmark.confirm }).click();
    await expect(markers).toHaveCount(baseline);
  }
});

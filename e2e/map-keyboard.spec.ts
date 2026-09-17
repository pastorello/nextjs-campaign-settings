import { test, expect, type Page } from "@playwright/test";
import messages from "@/messages/it.json";

import { contextMenu } from "./helpers/mapContextMenu";

/**
 * TD-133 (WCAG 2.1.1) — the map's two entry points work without a mouse:
 * Shift+F10 on the focused map opens the context menu at the map's centre,
 * and a marker is reached with Tab and opened with Enter.
 *
 * Creating the landmark is part of the same keyboard path, so the test needs
 * no seeded marker of its own and cleans up after itself.
 */

/** Tab forward until the focused element's accessible name is `name`. */
async function tabTo(page: Page, name: string): Promise<void> {
  for (let step = 0; step < 60; step += 1) {
    await page.keyboard.press("Tab");
    const label = await page.evaluate(() =>
      document.activeElement?.getAttribute("aria-label")
    );
    if (label === name) return;
  }
  throw new Error(`Tab never reached a map layer named "${name}"`);
}

test.describe("map keyboard access (TD-133)", () => {
  test("adds a landmark from Shift+F10, then opens it with Tab and Enter", async ({
    page,
  }) => {
    const title = `E2E keyboard landmark ${Date.now()}`;

    await page.goto("/dashboard/dnd5e/geography");
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible();
    await page.waitForLoadState("networkidle");

    await expect(map).toHaveAttribute("aria-keyshortcuts", /Shift\+F10/);

    // Retried for the same reason `helpers/mapContextMenu.ts` retries a
    // right-click: the key can land before Leaflet's handler is attached.
    const menu = contextMenu(page);
    await expect(async () => {
      await map.focus();
      await page.keyboard.press("Shift+F10");
      await expect(menu).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 15000 });

    // The menu takes focus, so the arrow keys reach its entries.
    const addPlace = menu.getByRole("button", {
      name: messages.geography.contextMenu.addPlace.trigger,
    });
    for (let step = 0; step < 10; step += 1) {
      if (await addPlace.evaluate((el) => el === document.activeElement)) {
        break;
      }
      await page.keyboard.press("ArrowDown");
    }
    await expect(addPlace).toBeFocused();
    await page.keyboard.press("Enter");

    const titleInput = page.getByPlaceholder(
      messages.geography.poiPanel.placeholders.placeName
    );
    await titleInput.fill(title);
    await page
      .getByRole("button", { name: messages.geography.poiPanel.save.save })
      .press("Enter");
    await page
      .getByRole("button", {
        name: messages.geography.poiPanel.close,
        exact: true,
      })
      .press("Enter");

    // Enter opens the place popover once `createPoi` has resolved — the
    // marker's handler waits for the row id, and nothing observable marks
    // that moment (same reasoning as `map-landmark-popover.spec.ts`).
    const popover = page.getByRole("dialog", { name: title });
    await expect(async () => {
      await map.focus();
      await tabTo(page, title);
      await page.keyboard.press("Enter");
      await expect(popover).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15000 });

    // Clean up through the popover's own delete, as the landmark spec does.
    await popover
      .getByRole("button", {
        name: messages.geography.popover.deleteLandmark,
      })
      .press("Enter");
    await expect(popover).not.toBeVisible();
    await expect(page.getByRole("button", { name: title })).toHaveCount(0);
  });
});

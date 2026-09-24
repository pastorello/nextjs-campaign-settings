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
    const popover = page.getByRole("dialog", { name: title, exact: true });
    await expect(async () => {
      await map.focus();
      await tabTo(page, title);
      await page.keyboard.press("Enter");
      await expect(popover).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15000 });

    // Focus moves into the popover, onto its first action…
    await expect(
      popover.getByRole("button", { name: messages.geography.popover.attach })
    ).toBeFocused();

    // …and Escape closes it, handing focus back to the marker.
    await page.keyboard.press("Escape");
    await expect(popover).not.toBeVisible();
    const marker = page.getByRole("button", { name: title, exact: true });
    await expect(marker).toBeFocused();

    // Enter again reopens it from there. Clean up through the popover's own
    // "Rimuovi", as the landmark spec does — now the one question SPEC-023
    // replaced TD-140's bare confirmation with, keyboard-operable the same
    // way. The trigger is matched exactly: the entity rows' own "Rimuovi
    // {name} da questo luogo" would otherwise match it as a substring.
    await page.keyboard.press("Enter");
    await expect(popover).toBeVisible();
    await popover
      .getByRole("button", {
        name: messages.geography.popover.remove,
        exact: true,
      })
      .press("Enter");
    // SPEC-023 — the outcome is a radio, chosen with Space, and only then
    // is there anything to confirm.
    await page
      .getByRole("radio", {
        name: messages.geography.removeLandmark.outcomes.deleteLabel,
      })
      .press("Space");
    await page
      .getByRole("button", {
        name: messages.geography.removeLandmark.confirm,
      })
      .press("Enter");
    await expect(popover).not.toBeVisible();
    await expect(page.getByRole("button", { name: title })).toHaveCount(0);
  });
});

/**
 * SPEC-025 — the other half of TD-133: a position can be typed, as a
 * percentage of the map image, instead of clicked. The keyboard could
 * already open "Aggiungi luogo" at the map's centre; until this, the centre
 * was the only position it could ever choose.
 */
test.describe("typed coordinates (SPEC-025)", () => {
  test("creates a landmark at a position typed into the form", async ({
    page,
  }) => {
    const title = `E2E typed position ${Date.now()}`;

    await page.goto("/dashboard/dnd5e/geography");
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible();
    await page.waitForLoadState("networkidle");

    const menu = contextMenu(page);
    await expect(async () => {
      await map.focus();
      await page.keyboard.press("Shift+F10");
      await expect(menu).toBeVisible({ timeout: 1500 });
    }).toPass({ timeout: 15000 });

    const addPlace = menu.getByRole("button", {
      name: messages.geography.contextMenu.addPlace.trigger,
    });
    for (let step = 0; step < 10; step += 1) {
      if (await addPlace.evaluate((el) => el === document.activeElement)) {
        break;
      }
      await page.keyboard.press("ArrowDown");
    }
    await page.keyboard.press("Enter");

    // The fields are there before anything is clicked, and carry the centre
    // the context menu opened at.
    const across = page.getByLabel(
      messages.geography.poiPanel.fields.positionAcross
    );
    const down = page.getByLabel(
      messages.geography.poiPanel.fields.positionDown
    );
    await expect(across).toBeVisible();
    await expect(across).not.toHaveValue("");

    await across.fill("25");
    await down.fill("70");
    await page
      .getByPlaceholder(messages.geography.poiPanel.placeholders.placeName)
      .fill(title);
    await page
      .getByRole("button", { name: messages.geography.poiPanel.save.save })
      .press("Enter");
    await page
      .getByRole("button", {
        name: messages.geography.poiPanel.close,
        exact: true,
      })
      .press("Enter");

    const marker = page.getByRole("button", { name: title, exact: true });
    await expect(marker).toBeVisible({ timeout: 15000 });

    // Clean up through the popover, as the landmark specs do — retried for
    // the reason the test above gives: the marker's handler does nothing
    // until `createPoi` resolves and hands it the row id, and nothing
    // observable marks that moment, so the first click can land on a marker
    // that is drawn but not yet clickable.
    const popover = page.getByRole("dialog", { name: title, exact: true });
    await expect(async () => {
      await marker.click();
      await expect(popover).toBeVisible({ timeout: 1000 });
    }).toPass({ timeout: 15000 });
    await popover
      .getByRole("button", {
        name: messages.geography.popover.remove,
        exact: true,
      })
      .click();
    // SPEC-023: a landmark's own one question — pick the
    // destructive outcome, then confirm it.
    await page
      .getByRole("radio", {
        name: messages.geography.removeLandmark.outcomes.deleteLabel,
      })
      .click();
    await page
      .getByRole("button", {
        name: messages.geography.removeLandmark.confirm,
      })
      .click();
    await expect(page.getByRole("button", { name: title })).toHaveCount(0);
  });
});

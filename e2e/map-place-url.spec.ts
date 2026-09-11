import { test, expect } from "@playwright/test";
import messages from "@/messages/it.json";

import { chooseFromContextMenu } from "./helpers/mapContextMenu";

/**
 * TD-82 — the place in view owns the URL. `GeographyExplorer` writes
 * `?place=<id>` with `history.replaceState` on every hop, and the page's
 * existing read path (SPEC-011 T4) rebuilds the same stack from it on a
 * reload. The unit tests run against jsdom's history; only a real browser
 * shows that the native call syncs with the Next.js router without breaking
 * it, and that a reload really lands back on the same map.
 *
 * `replaceState`, not `pushState`, by the DM's choice: back leaves the map
 * instead of retracing each hop, which the last assertion pins down.
 *
 * Built on the root and deleted at the end through the popover's own
 * "Rimuovi definitivamente", the same cleanup `map-unplace.spec.ts` uses.
 */
const PNG_FILE = {
  name: "region.png",
  mimeType: "image/png",
  buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
};

test.describe("the place in view has a URL of its own (TD-82)", () => {
  test("descending names the place in the URL, a reload reopens it, and back leaves the map", async ({
    page,
  }) => {
    const title = `E2E place url ${Date.now()}`;

    // A page before the map, so back has somewhere to go that is not it.
    await page.goto("/dashboard");
    await page.goto("/dashboard/geography");
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);
    await expect(page).not.toHaveURL(/[?&]place=/);

    const navigableMarkers = page.locator(".custom-navigable-marker");
    const baselineMarkerCount = await navigableMarkers.count();

    await chooseFromContextMenu(
      page,
      { x: 500, y: 200 },
      messages.geography.contextMenu.addPlace.trigger
    );
    await page
      .locator("label", { hasText: "Kind" })
      .locator("xpath=following-sibling::select[1]")
      .selectOption("region");
    await page
      .locator('input[type="file"][accept*="image"]')
      .setInputFiles(PNG_FILE);
    await page.getByPlaceholder("Enter place name").fill(title);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(navigableMarkers).toHaveCount(baselineMarkerCount + 1);
    // The panel stays open over the map's left edge and would occlude the
    // marker just created.
    await page.getByRole("button", { name: "Close", exact: true }).click();

    const popover = page.getByRole("dialog", { name: title });
    await navigableMarkers.last().click();
    await expect(popover).toBeVisible();
    await popover
      .getByRole("button", { name: messages.geography.popover.openMap })
      .click();

    const heading = page.getByRole("heading", { level: 1, name: title });
    await expect(heading).toBeVisible();
    await expect(page).toHaveURL(/[?&]place=\d+/);
    const placeId = new URL(page.url()).searchParams.get("place");

    // The point of TD-82: the same map after a reload, "up" included.
    await page.reload();
    await expect(heading).toBeVisible();
    await expect(
      page.getByRole("button", { name: messages.geography.up })
    ).toBeVisible();
    expect(new URL(page.url()).searchParams.get("place")).toBe(placeId);

    await page.getByRole("button", { name: messages.geography.up }).click();
    await expect(heading).toHaveCount(0);
    await expect(page).not.toHaveURL(/[?&]place=/);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    // Cleanup, as `map-unplace.spec.ts` does it.
    await navigableMarkers.last().click();
    await expect(popover).toBeVisible();
    await popover
      .getByRole("button", { name: messages.geography.popover.delete })
      .click();
    await page
      .getByRole("button", { name: messages.geography.deletePlace.confirm })
      .click();
    await expect(popover).not.toBeVisible();
    await expect(navigableMarkers).toHaveCount(baselineMarkerCount);

    // Every hop replaced the history entry rather than pushing one, so back
    // leaves the map instead of returning to the place.
    await page.goBack();
    await expect(page).toHaveURL(/\/dashboard$/);
  });
});

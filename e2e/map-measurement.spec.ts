import { test, expect } from "@playwright/test";
import messages from "@/messages/it.json";

/**
 * TD-46 (see docs/TECH_DEBT.md): `MapMeasurementPanel`, reachable from the
 * context menu's "Measure" item — distance mode, placing points on the map,
 * reading the running distance, and finishing the measurement.
 *
 * The sibling "area" mode and the search/filtering sub-slice originally
 * planned here are out of scope: `MapSearchBar` (country search) is entirely
 * commented out in `WorldMap.tsx` — unreachable by a real user today — so
 * there is nothing for an e2e spec to drive. See TD-46's note in
 * `docs/TECH_DEBT.md`.
 */
test.describe("map measurement", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/geography");
    await expect(page.locator(".leaflet-container")).toBeVisible();
  });

  test("distance mode: placing points updates the running distance, and finishing keeps the result", async ({
    page,
  }) => {
    const map = page.locator(".leaflet-container");
    await map.click({ button: "right", position: { x: 300, y: 200 } });
    await page
      .getByRole("button", {
        name: messages.geography.contextMenu.measure.trigger,
      })
      .click();

    await expect(page.getByText("Select a measurement mode")).toBeVisible();

    await page.getByTitle("Distance", { exact: true }).click();

    await map.click({ position: { x: 250, y: 150 } });
    await map.click({ position: { x: 450, y: 350 } });

    const pointsValue = page
      .locator("p", { hasText: "Points" })
      .locator("xpath=following-sibling::p[1]");
    await expect(pointsValue).toHaveText("2");

    const distanceValue = page
      .locator("p", { hasText: "Distance" })
      .locator("xpath=following-sibling::p[1]");
    await expect(distanceValue).not.toHaveText("—");

    await page.getByTitle("Done").click();

    await expect(page.getByText("Distance:")).toBeVisible();
    await expect(page.getByText("Select a measurement mode")).not.toBeVisible();

    await page.getByRole("button", { name: "Close measurement tools" }).click();
    await expect(page.getByText("Distance:")).not.toBeVisible();
  });
});

import { test, expect } from "@playwright/test";
import messages from "@/messages/it.json";

import {
  chooseFromContextMenu,
  openContextMenu,
} from "./helpers/mapContextMenu";

/**
 * SPEC-016 T7: the landmark popover variant — "Modifica" and "Elimina" reach
 * `MapPOIPanel`'s existing edit/delete machinery, closing TD-85's remainder
 * (that machinery had no entry point a DM could actually reach). Clicking a
 * landmark marker now opens the same place popover a zone does (T2), instead
 * of Leaflet's own native, read-only popup.
 */
test.describe("landmark popover (SPEC-016 T7)", () => {
  test("edits a landmark's title from the popover, then deletes it — no confirmation", async ({
    page,
  }) => {
    const title = `E2E landmark popover ${Date.now()}`;
    const updatedTitle = `${title} updated`;

    await page.goto("/dashboard/geography");
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    const landmarkMarkers = page.locator(".custom-poi-marker");
    const baselineCount = await landmarkMarkers.count();

    // Add a landmark (`kind: "poi"` is the panel's own default — unlike a
    // navigable place, it needs no map image and no kind selection).
    await chooseFromContextMenu(
      page,
      { x: 400, y: 250 },
      messages.geography.contextMenu.addPlace.trigger
    );
    await page.getByPlaceholder("Enter place name").fill(title);
    await page.getByRole("button", { name: "Save" }).click();

    // The panel stays open in list view after save (desktop layout, absolute
    // over the map's own left edge) — close it, or the marker this test just
    // created there is occluded and unclickable (same reasoning
    // `map-unplace.spec.ts` documents for its own navigable place).
    await page.getByRole("button", { name: "Close", exact: true }).click();

    await expect(landmarkMarkers).toHaveCount(baselineCount + 1);

    // Click opens the place popover now (T7), not Leaflet's own native one —
    // but `createPoi`'s server round trip has to land first: the click
    // handler refuses to fire until the POI has a resolved database id (T7's
    // guard against the brief optimistic window), and nothing observable
    // from here (no toast, no network event Playwright can key on) marks
    // that moment, so this retries the click itself rather than guessing a
    // delay.
    const popover = page.getByRole("dialog", { name: title });
    await expect(async () => {
      await landmarkMarkers.last().click();
      await expect(popover).toBeVisible({ timeout: 500 });
    }).toPass({ timeout: 10_000 });

    await popover
      .getByRole("button", { name: messages.geography.popover.editLandmark })
      .click();

    // `MapPOIPanel`'s edit form, pre-filled from the popover's own landmark
    // (T7's `editTarget` prop) rather than from a list row the DM never
    // clicked — nothing here goes through `POIListItem`.
    const titleInput = page.getByPlaceholder("Enter place name");
    await expect(titleInput).toHaveValue(title);
    await titleInput.fill(updatedTitle);
    await page.getByRole("button", { name: "Update" }).click();
    await page.waitForLoadState("networkidle");
    await page.getByRole("button", { name: "Close", exact: true }).click();

    // Same marker, new title — re-open the popover to confirm the edit
    // landed and to reach "Elimina" next.
    await expect(landmarkMarkers).toHaveCount(baselineCount + 1);
    await landmarkMarkers.last().click();
    const updatedPopover = page.getByRole("dialog", { name: updatedTitle });
    await expect(updatedPopover).toBeVisible();

    await updatedPopover
      .getByRole("button", {
        name: messages.geography.popover.deleteLandmark,
      })
      .click();

    // No confirmation dialog (§5: "deleting and re-creating a landmark is
    // cheap") — the popover and the marker are both just gone.
    await expect(updatedPopover).not.toBeVisible();
    await expect(landmarkMarkers).toHaveCount(baselineCount);
  });

  /**
   * SPEC-017 T10 — the landmark half of SPEC-016 T5's "Sposta nei luoghi non
   * posizionati". Until this existed a landmark could only reach the pool as
   * a side effect of deleting its zone (SPEC-010 rule 2), so moving one from
   * one map to another was unreachable however good the picker got: the pool
   * had a way out for landmarks and no way in.
   */
  test("sends a landmark back to the unpositioned places, where the picker finds it", async ({
    page,
  }) => {
    const title = `E2E landmark unplace ${Date.now()}`;

    await page.goto("/dashboard/geography");
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    const landmarkMarkers = page.locator(".custom-poi-marker");
    const baselineCount = await landmarkMarkers.count();

    await chooseFromContextMenu(
      page,
      { x: 420, y: 300 },
      messages.geography.contextMenu.addPlace.trigger
    );
    await page.getByPlaceholder("Enter place name").fill(title);
    await page.getByRole("button", { name: "Save" }).click();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(landmarkMarkers).toHaveCount(baselineCount + 1);

    // Same retry-the-click dance as the test above: the popover refuses to
    // open until `createPoi`'s round trip has given the marker a real id.
    const popover = page.getByRole("dialog", { name: title });
    await expect(async () => {
      await landmarkMarkers.last().click();
      await expect(popover).toBeVisible({ timeout: 500 });
    }).toPass({ timeout: 10_000 });

    await popover
      .getByRole("button", { name: messages.geography.popover.unplace })
      .click();

    // No confirmation, and both the marker and the popover go: un-placing
    // removes the very thing the popover was anchored to.
    await expect(popover).not.toBeVisible();
    await expect(landmarkMarkers).toHaveCount(baselineCount);

    // The proof that it went to the pool rather than being deleted.
    const menu = await openContextMenu(page, { x: 500, y: 400 });
    await menu
      .getByRole("button", {
        name: messages.geography.contextMenu.positionPlace.trigger,
      })
      .click();
    await expect(menu.getByText(title)).toBeVisible();
  });
});

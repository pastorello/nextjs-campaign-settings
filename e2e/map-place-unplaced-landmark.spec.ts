import { test, expect } from "@playwright/test";
import messages from "@/messages/it.json";

import {
  chooseFromContextMenu,
  openContextMenu,
} from "./helpers/mapContextMenu";

/**
 * TD-102: positioning an unplaced **landmark** from "Posiziona luogo".
 *
 * `fetchPlaceChildren` merges two tables — `zone` (navigable places) and
 * `poi` (landmarks) — into one list, and `useUnplacedChildren` filters that
 * list to the rows with no coordinates. So the dropdown offers unplaced
 * landmarks next to unplaced places, both identified by `id` alone, from two
 * independent sequences. Every pick used to go to `updateZonePosition`,
 * which writes `zone`: a landmark id therefore addressed whichever zone
 * happened to carry the same number — a different place, or none.
 *
 * This is the first e2e that can exist for §5.A's picker flow at all.
 * SPEC-005 §10 T7 recorded that it could not: nothing the running app did
 * produced a row without coordinates, since `placeSchema` requires them at
 * creation. SPEC-010 T1 changed that — deleting a place reparents its
 * landmarks to the grandparent and clears their position — and that is
 * exactly the path this test walks, rather than reaching around the app to
 * seed such a row directly.
 *
 * Against the pre-fix code this fails at the last step: the landmark's id
 * matches no *unpositioned* zone, so the placement is refused and no marker
 * ever appears.
 */
const PNG_FILE = {
  name: "region.png",
  mimeType: "image/png",
  buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
};

test.describe("positioning an unplaced landmark (TD-102)", () => {
  test("places it on the map instead of addressing a zone that shares its id", async ({
    page,
  }) => {
    const parentTitle = `E2E landmark parent ${Date.now()}`;
    const landmarkTitle = `E2E orphan landmark ${Date.now()}`;

    await page.goto("/dashboard/geography");
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible();
    // Let the image-overlay bootstrap's interim-then-corrective refit settle
    // (TD-81/TD-87) before anything coordinate-sensitive, the same wait
    // `map-unplace.spec.ts` documents.
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    const landmarkMarkers = page.locator(".custom-poi-marker");
    const navigableMarkers = page.locator(".custom-navigable-marker");
    const baselineLandmarks = await landmarkMarkers.count();
    const baselineNavigable = await navigableMarkers.count();
    const popover = page.getByRole("dialog");

    // 1. A navigable place with its own map, to hold the landmark and then
    //    be deleted out from under it. `region` needs a map image at
    //    creation (`MapPOIPanel`'s `handleSave`), so this uploads the same
    //    minimal PNG `world.setup.ts` relies on.
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
    await page.getByPlaceholder("Enter place name").fill(parentTitle);
    await page.getByRole("button", { name: "Save" }).click();
    await expect(navigableMarkers).toHaveCount(baselineNavigable + 1);

    // The panel stays open in list view over the map's left edge — close it
    // or the marker just created is occluded and unclickable.
    await page.getByRole("button", { name: "Close", exact: true }).click();

    // 2. Descend into it and put a landmark inside. `kind: "poi"` is the
    //    panel's own default, so no kind selection and no map image.
    await navigableMarkers.last().click();
    await expect(popover).toBeVisible();
    await popover
      .getByRole("button", { name: messages.geography.popover.openMap })
      .click();
    await expect(map).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    await chooseFromContextMenu(
      page,
      { x: 500, y: 200 },
      messages.geography.contextMenu.addPlace.trigger
    );
    await page.getByPlaceholder("Enter place name").fill(landmarkTitle);
    await page.getByRole("button", { name: "Save" }).click();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(page.locator(".custom-poi-marker")).toHaveCount(1);

    // 3. Delete the place we are standing on. SPEC-010 rule 2: the landmark
    //    moves up to the grandparent and loses its position — the only
    //    in-app way to produce an unplaced landmark.
    await page
      .getByRole("button", { name: messages.geography.mapOptions.trigger })
      .click();
    await page
      .getByRole("button", { name: messages.geography.deletePlace.trigger })
      .click();
    await page
      .getByRole("button", { name: messages.geography.deletePlace.confirm })
      .click();

    // Back on the parent map, with the deleted place's marker gone.
    await expect(navigableMarkers).toHaveCount(baselineNavigable);
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    // 4. The landmark is now in "Posiziona luogo" — and picking it must
    //    write to `poi`. Read the menu first, so a missing entry fails here
    //    with "the dropdown does not list it" rather than as a timeout on
    //    the click.
    const menu = await openContextMenu(page, { x: 500, y: 400 });
    await menu
      .getByRole("button", {
        name: messages.geography.contextMenu.positionPlace.trigger,
      })
      .click();
    await expect(menu.getByText(landmarkTitle)).toBeVisible();
    await menu.getByText(landmarkTitle).click();
    await expect(menu).toBeHidden();

    // The proof: a landmark marker exists on this map that did not before.
    // Pre-fix, the placement was refused and this count never moved.
    await expect(landmarkMarkers).toHaveCount(baselineLandmarks + 1);

    // Cleanup, through the landmark popover's own unconfirmed delete
    // (SPEC-016 T7).
    await landmarkMarkers.last().click();
    await expect(popover).toBeVisible();
    await popover
      .getByRole("button", { name: messages.geography.popover.deleteLandmark })
      .click();
    await expect(landmarkMarkers).toHaveCount(baselineLandmarks);
  });
});

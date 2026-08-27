import { test, expect } from "@playwright/test";
import messages from "@/messages/it.json";

import {
  chooseFromContextMenu,
  contextMenu,
  openContextMenu,
} from "./helpers/mapContextMenu";

/**
 * SPEC-016 T5: "Sposta nei luoghi non posizionati" sends a positioned place
 * back to the unpositioned pool, no confirmation (§9's open question, agreed
 * 2026-08-21).
 *
 * This is also the first in-app path that can ever produce a coordinate-less
 * zone. `map-place-repositioning.spec.ts` used to note that §5.A's "Posiziona
 * luogo" picker had no e2e spec because nothing could produce an unplaced row
 * through the UI — `placeSchema.ts` requires `lat`/`lng` at creation for
 * every kind. Un-placing closes that gap: create a positioned place, then
 * send it back.
 *
 * A navigable kind (here `region`) is required, not `kind: "poi"` — only a
 * navigable place opens the place popover (`useNavigableChildren`), and only
 * the popover carries "Sposta nei luoghi non posizionati". Creating one needs
 * its own map image at creation time (`MapPOIPanel`'s `handleSave`), so this
 * uploads the same minimal PNG `world.setup.ts` already relies on.
 */
const PNG_FILE = {
  name: "region.png",
  mimeType: "image/png",
  buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
};

test.describe("un-placing a positioned place (SPEC-016 T5)", () => {
  test('clears its position, drops its marker, and it reappears — with the count incremented — in "Posiziona luogo"', async ({
    page,
  }) => {
    const title = `E2E unplace region ${Date.now()}`;

    await page.goto("/dashboard/geography");
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible();
    // Let the image-overlay bootstrap's interim-then-corrective-refit
    // settle (TD-81/TD-87) before doing anything coordinate-sensitive —
    // otherwise a right-click can land during the interim framing, and a
    // later correction moves the camera out from under the place it just
    // positioned there.
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);
    const menu = contextMenu(page);
    const positionButton = menu.locator("button", {
      hasText: messages.geography.contextMenu.positionPlace.trigger,
    });

    const navigableMarkers = page.locator(".custom-navigable-marker");

    // Baseline, read before this test adds anything — the proofs below are
    // all deltas, not absolute counts, since other rows may already be
    // unpositioned or on the map (e.g. from a previous, non-cleaned-up run).
    await openContextMenu(page, { x: 250, y: 150 });
    const baselineText = await positionButton.textContent();
    const baselineCount = parseInt(baselineText?.match(/\d+/)?.[0] ?? "0", 10);
    await page.keyboard.press("Escape");
    await expect(menu).toBeHidden();
    const baselineMarkerCount = await navigableMarkers.count();

    // Create a navigable place with a map image, so it has coordinates to
    // un-place in the first place.
    await chooseFromContextMenu(
      page,
      { x: 300, y: 200 },
      messages.geography.contextMenu.addPlace.trigger
    );
    // Scoped to the "Kind" field specifically, not `getByRole("combobox")`
    // — the dashboard's own `LocaleSwitcher` is a `<select>` too, and the
    // panel shows a second one (Category) alongside Kind while the kind is
    // still the default "poi". The label has no `htmlFor`, so this walks to
    // its sibling `<select>` directly rather than relying on ordering.
    await page
      .locator("label", { hasText: "Kind" })
      .locator("xpath=following-sibling::select[1]")
      .selectOption("region");
    // The panel has a second, hidden `input[type="file"]` for GeoJSON
    // import — scoped to the map-image one by its `accept`.
    await page
      .locator('input[type="file"][accept*="image"]')
      .setInputFiles(PNG_FILE);
    await page.getByPlaceholder("Enter place name").fill(title);
    await page.getByRole("button", { name: "Save" }).click();

    // The panel (`MapPOIPanel`, desktop layout) is absolutely positioned
    // over the map's own left edge and stays open in list view after save —
    // close it, or the marker this test just created there is occluded and
    // unclickable.
    await page.getByRole("button", { name: "Close" }).click();

    // `.last()`, not the bare locator: `fetchPlaceChildren` orders by
    // `createdAt` ascending, so the place this test just created is always
    // the last one rendered — robust even if a stray navigable place from
    // an unrelated run is still sitting in the e2e database.
    await expect(navigableMarkers).toHaveCount(baselineMarkerCount + 1);
    await navigableMarkers.last().click();

    const popover = page.getByRole("dialog", { name: title });
    await expect(popover).toBeVisible();
    await popover
      .getByRole("button", { name: messages.geography.popover.unplace })
      .click();

    // Gone from the map and off the popover's own place — nothing left at
    // this position to show. Checked by count, not `.last()` visibility:
    // that locator re-resolves to whatever else currently matches, which
    // after this removal is a different element, not "nothing."
    await expect(popover).not.toBeVisible();
    await expect(navigableMarkers).toHaveCount(baselineMarkerCount);

    // Back in the unpositioned pool: "Posiziona luogo" is enabled (it may
    // have started disabled, at a baseline of zero), its count reflects the
    // one that just joined, and it is listed by name.
    await openContextMenu(page, { x: 250, y: 150 });
    await expect(positionButton).toBeEnabled();
    const afterText = await positionButton.textContent();
    const afterCount = parseInt(afterText?.match(/\d+/)?.[0] ?? "0", 10);
    expect(afterCount).toBe(baselineCount + 1);
    await positionButton.click();
    await expect(menu.getByText(title)).toBeVisible();

    // Cleanup, round-tripping through the same dropdown (SPEC-016 T5's
    // pairing action, TD-85): picking it positions it right back at the
    // point the menu is open over, no second click needed
    // (`handleContextMenuPositionPlace`). Then delete it straight from the
    // popover's own "Rimuovi definitivamente" (SPEC-016 T6) — no need to
    // descend into the place and reach it through `MapOptionsButton`.
    await menu.getByText(title).click();
    await expect(menu).toBeHidden();

    await expect(navigableMarkers).toHaveCount(baselineMarkerCount + 1);
    await navigableMarkers.last().click();
    await expect(popover).toBeVisible();
    await popover
      .getByRole("button", { name: messages.geography.popover.delete })
      .click();
    await page
      .getByRole("button", { name: messages.geography.deletePlace.confirm })
      .click();

    // The popover's own place no longer exists — nothing left at this
    // position to show, the same proof-of-cleanup shape
    // `map-place-repositioning.spec.ts` uses for its own test row.
    await expect(popover).not.toBeVisible();
    await expect(navigableMarkers).toHaveCount(baselineMarkerCount);
  });
});

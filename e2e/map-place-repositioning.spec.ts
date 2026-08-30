import { test, expect } from "@playwright/test";
import messages from "@/messages/it.json";

import { chooseFromContextMenu } from "./helpers/mapContextMenu";

/**
 * TD-71 / SPEC-005 §5.B: a DM can drag an already-placed marker to a new
 * spot, and the new position persists. Writes through the same `updatePoi`
 * action every other write in this file already exercises indirectly — this
 * spec's job is proving the drag wiring works end to end against a real row,
 * not re-covering per-kind marker logic the hook unit tests already do
 * (`usePOIManager.test.ts`, `useNavigableChildren.test.ts`).
 *
 * Uses `kind: "poi"` — the cheapest kind to set up through the UI (no map
 * image upload) and enough to prove the plumbing, per docs/TESTING.md's
 * "E2E is expensive and each one must earn its place".
 *
 * **§5.A (the "Unplaced places" picker) had no e2e spec here, historically,
 * because nothing could produce an unplaced row through the UI** —
 * `placeSchema.ts` requires `lat`/`lng` at creation time for every kind, and
 * the only unplaced rows that ever existed were SPEC-004's one-time
 * world-seed script's. SPEC-016 T5's "Sposta nei luoghi non posizionati"
 * closed that gap — un-placing an already-positioned region is now the
 * in-app path, exercised end to end in `map-unplace.spec.ts`, which also
 * covers the context menu's dropdown and count. This file stays scoped to
 * drag repositioning. §5.A's own panel picker is gone since SPEC-016 T9 —
 * the context-menu entry is the single method — so what survives of its
 * unit coverage is `useUnplacedChildren.test.ts` (the query) and
 * `MapContextMenu.test.tsx`'s dropdown block.
 *
 * ## Why this was `test.fixme` for five days (TD-101, closed 2026-08-27)
 *
 * It was green for its whole life on an assertion that could not fail: it
 * read the "before" position from the panel row (`formatDecimalDegrees(…,
 * 4)` → `"1890.8620, 344.0000"`) and the "after" position from the marker's
 * native Leaflet popup (`toFixed(6)` → `"1890.862000, 344.000000"`). Two
 * different formatters, so `expect(after).not.toBe(before)` held whether or
 * not the drag did anything. SPEC-016 T7 removed that popup, which forced
 * both readings onto the panel row — and comparing like with like, it
 * failed: the marker did not move at all.
 *
 * **The drag was never broken.** The marker was unreachable. This spec
 * created its POI by right-clicking the map at `{x: 300, y: 200}`, and
 * `MapPOIPanel` — open in list view immediately after a save — is
 * `absolute top-0 left-0 h-full w-96 … z-[1000]`, so it covers the map's
 * leftmost 384px. A marker at map-x 300 sits underneath it:
 * `document.elementFromPoint` at the marker's centre returned the panel's
 * header-image gradient, so `page.mouse.down()` pressed the panel, not the
 * marker, and `dragend` never fired. Moving the creation point clear of the
 * panel (below) makes the same real-mouse gesture drag the marker, fire
 * `dragend`, and persist — verified 2026-08-27 by probing the icon's
 * `transform` between each mouse step.
 *
 * Leaflet's own drag machinery was armed the whole time: the icon carried
 * `leaflet-marker-draggable`, and a purely synthetic mousedown/mousemove/
 * mouseup on it moved the marker even in the covered case. So this was
 * never a `L.Draggable`-under-Playwright problem, and nothing in
 * `usePOIManager` or `useNavigableChildren` needed changing.
 *
 * Do not re-green a future failure here by loosening the comparison back to
 * two formatters, and keep the creation point clear of the panel.
 */
test.describe("place repositioning (TD-71, SPEC-005 §5.B)", () => {
  test("repositions an already-placed marker by dragging it", async ({
    page,
  }) => {
    const title = `E2E drag POI ${Date.now()}`;

    await page.goto("/dashboard/geography");
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible();

    // Clear of `MapPOIPanel` (TD-101): the panel is open in list view for
    // the whole drag below, and it covers the map's leftmost 384px, so a
    // marker created there cannot be pressed. Anything past x ≈ 400 is
    // reachable; x 600 leaves room for the +120px drag as well.
    await chooseFromContextMenu(
      page,
      { x: 600, y: 300 },
      messages.geography.contextMenu.addPlace.trigger
    );
    await page.getByPlaceholder("Enter place name").fill(title);
    await page.getByRole("button", { name: "Save" }).click();

    // Save returns the panel to list view, showing the row it just created —
    // read its coordinates now, before dragging, so the persisted position
    // read back after can be shown to have actually changed, not just to be
    // some number.
    const initialListItem = page.locator("button", { hasText: title }).first();
    const initialRow = page.locator("div", { has: initialListItem }).last();
    const initialCoords = initialRow
      .locator("div", { hasText: /-?\d+\.\d+, -?\d+\.\d+/ })
      .last();
    const initialCoordsText = await initialCoords.textContent();

    // `.last()`, not `.first()`: `fetchPlaceChildren` orders by `createdAt`
    // ascending, so the POI this test just created is always the last marker
    // rendered — the same reasoning `map-unplace.spec.ts` documents for its
    // own row. `.first()` grabbed whichever POI happened to be oldest, which
    // is the right one only on a database no earlier failed run has left
    // anything in.
    const marker = page.locator(".custom-poi-marker").last();
    await expect(marker).toBeVisible();

    const before = await marker.boundingBox();
    if (!before) throw new Error("marker has no bounding box");
    const startX = before.x + before.width / 2;
    const startY = before.y + before.height / 2;
    const targetX = startX + 120;
    const targetY = startY + 80;

    // A real drag, not `.dispatchEvent` — this is the one interaction in
    // the suite that needs Leaflet's own drag handling to actually run, not
    // to be routed around (contrast `map-poi-crud.spec.ts`'s clicks, which
    // deliberately avoid it).
    await page.mouse.move(startX, startY);
    await page.mouse.down();
    await page.mouse.move(startX + 40, startY + 20, { steps: 5 });
    await page.mouse.move(targetX, targetY, { steps: 5 });
    await page.mouse.up();

    // First, that the drop landed at all: `dragend` fires, `updatePOI`
    // applies its optimistic move, and the row re-renders with the new
    // position — all before any server round trip. TD-101's failure was
    // exactly here (nothing moved, no optimistic update), so asserting it
    // separately keeps "the drag never happened" distinguishable from "the
    // drag happened but was not saved".
    await expect(initialCoords).not.toHaveText(initialCoordsText ?? "");

    // Then persistence: reload and read the position back from the panel's
    // own list row.
    //
    // That row — not the marker — because SPEC-016 T7 removed the native
    // Leaflet popup this used to click the marker for: a landmark click now
    // opens the place popover, which shows what a place *is* (description,
    // who is there, its actions), never its raw coordinates. The row is also
    // the better reading: it is the same source `initialCoordsText` came
    // from above, so the two are compared like for like rather than across
    // two different formatters.
    await page.reload();
    await expect(map).toBeVisible();
    const movedMarker = page.locator(".custom-poi-marker").last();
    await expect(movedMarker).toBeVisible();

    // `MapPOIPanel` stays mounted off-screen when closed (a CSS transform,
    // not `display: none`) — the reload above reset `isPOIPanelOpen` to
    // false, so the list has to be reopened before its rows are actually
    // reachable, not just present in the DOM. Right-click somewhere away
    // from the marker's post-drag position, which would otherwise swallow
    // the right-click instead of the map.
    await chooseFromContextMenu(
      page,
      { x: 300, y: 500 },
      messages.geography.contextMenu.addPlace.trigger
    );
    await page.getByRole("button", { name: "Back" }).click();

    const listItem = page.locator("button", { hasText: title }).first();
    const row = page.locator("div", { has: listItem }).last();
    const finalCoordsText = await row
      .locator("div", { hasText: /-?\d+\.\d+, -?\d+\.\d+/ })
      .last()
      .textContent();
    const [lat, lng] = (finalCoordsText ?? "")
      .split(",")
      .map((part) => parseFloat(part));
    expect(Number.isFinite(lat)).toBe(true);
    expect(Number.isFinite(lng)).toBe(true);
    // The actual proof the drag persisted, not just that some number is
    // there: the position read back after a reload is not the one the POI
    // was created at.
    expect(finalCoordsText).not.toBe(initialCoordsText);

    // Cleanup.
    await row.hover();
    await row.getByTitle("Delete").click();
    await expect(listItem).toHaveCount(0);
  });
});

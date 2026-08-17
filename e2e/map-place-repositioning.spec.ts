import { test, expect } from "@playwright/test";
import messages from "@/messages/it.json";

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
 * **§5.A (the "Unplaced places" picker) has no e2e spec here, deliberately.**
 * Testing it for real needs a place with no coordinates to start from, and
 * there is currently no in-app path that produces one: `placeSchema.ts`
 * requires `lat`/`lng` at creation time for every kind. The only unplaced
 * rows that have ever existed are SPEC-004's one-time world-seed script's —
 * not something `pnpm dev`'s UI, or this e2e database (seeded only by
 * `world.setup.ts`'s single root place, itself coordinate-less by a
 * different mechanism — it has no parent map to sit on), can produce. Every
 * other e2e spec in this suite creates its rows through the app specifically
 * to avoid reaching around it (docs/TESTING.md); doing that here would mean
 * either adding a raw-DB seeding path to the e2e harness — a new precedent,
 * not a TD-71-sized decision — or writing an e2e spec that can never
 * actually reach the code it claims to test. §5.A's wiring is instead
 * covered where it's reachable: `useUnplacedChildren.test.ts` (the data
 * layer), `MapPOIPanel.test.tsx`'s "unplaced places" describe block (the
 * picker UI), and `WorldMap.test.tsx`'s "positioning an unplaced place"
 * describe block (crosshair mode, `updatePoi` called with only
 * `{ id, lat, lng }`, the reload/refetch triggers).
 */
test.describe("place repositioning (TD-71, SPEC-005 §5.B)", () => {
  test("repositions an already-placed marker by dragging it", async ({
    page,
  }) => {
    const title = `E2E drag POI ${Date.now()}`;

    await page.goto("/dashboard/geography");
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible();

    await map.click({ button: "right", position: { x: 300, y: 200 } });
    await page
      .getByRole("button", {
        name: messages.geography.contextMenu.addPlace.trigger,
      })
      .click();
    await page.getByPlaceholder("Enter place name").fill(title);
    await page.getByRole("button", { name: "Save" }).click();

    // Save returns the panel to list view, showing the row it just created —
    // read its coordinates now, before dragging, so the persisted position
    // read back after can be shown to have actually changed, not just to be
    // some number.
    const initialListItem = page.locator("button", { hasText: title }).first();
    const initialRow = page.locator("div", { has: initialListItem }).last();
    const initialCoordsText = await initialRow
      .locator("div", { hasText: /-?\d+\.\d+, -?\d+\.\d+/ })
      .last()
      .textContent();

    const marker = page.locator(".custom-poi-marker").first();
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

    // Persistence, not just the optimistic client-side move: reload and
    // confirm the popup still shows the dropped-at coordinates.
    await page.reload();
    await expect(map).toBeVisible();
    const movedMarker = page.locator(".custom-poi-marker").first();
    await expect(movedMarker).toBeVisible();
    await movedMarker.dispatchEvent("click");

    const coordsLocator = page.locator(
      ".leaflet-popup-content .text-\\[11px\\]"
    );
    await expect(coordsLocator).toBeVisible();
    const finalCoordsText = await coordsLocator.textContent();
    const [lat, lng] = (finalCoordsText ?? "")
      .split(",")
      .map((part) => parseFloat(part));
    expect(Number.isFinite(lat)).toBe(true);
    expect(Number.isFinite(lng)).toBe(true);
    // The actual proof the drag persisted, not just that some number is
    // there: the position read back after a reload is not the one the POI
    // was created at.
    expect(finalCoordsText).not.toBe(initialCoordsText);

    // Cleanup. `MapPOIPanel` stays mounted off-screen when closed (a CSS
    // transform, not `display: none`) — the reload above reset
    // `isPOIPanelOpen` to false, so the list has to be reopened before its
    // rows are actually reachable, not just present in the DOM. Right-click
    // somewhere away from the marker's post-drag position and its still-open
    // popup, which would otherwise swallow the click instead of the map.
    await map.click({ button: "right", position: { x: 700, y: 450 } });
    await page
      .getByRole("button", {
        name: messages.geography.contextMenu.addPlace.trigger,
      })
      .click();
    await page.getByRole("button", { name: "Back" }).click();

    const listItem = page.locator("button", { hasText: title }).first();
    const row = page.locator("div", { has: listItem }).last();
    await row.hover();
    await row.getByTitle("Delete").click();
    await expect(listItem).toHaveCount(0);
  });
});

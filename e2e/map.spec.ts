import { test, expect, type Page, type Locator } from "@playwright/test";
import messages from "@/messages/it.json";

/**
 * The Leaflet map. Per docs/TESTING.md §"Explicitly out of scope" this does not
 * test Leaflet's own rendering — it tests that our module mounts it and that
 * the context menu a DM uses to drop a marker opens where they click.
 *
 * SPEC-004 M7 replaced the hardcoded four-map switcher with tree navigation:
 * `/dashboard/geography` now shows the root place `world.setup.ts` creates,
 * served through `/api/maps/[id]/image`, not a `/maps/*.jpg` file. The former
 * "switching world swaps the map image" test asserted on that switcher
 * button, which no longer exists, and is gone with it — a real "descend into
 * a region" e2e test needs a nested region to click, and nothing can create
 * one without M5's kind selector (see SPEC-004 §10 M7's own note on this).
 *
 * NOTE: this map has no tile layer. Each world is a single hand-drawn image
 * placed with Leaflet's image overlay, so the DOM carries one
 * `.leaflet-image-layer` and no `.leaflet-tile` at all. Asserting on tiles
 * looks right and always fails.
 */
const imageLayer = ".leaflet-image-layer";

/**
 * Right-click the map until the context menu is actually open (TD-100).
 *
 * `.leaflet-container` becoming visible is not "the map is ready": on a slow
 * environment (CI runners, chiefly) the first right-click can land before
 * Leaflet's `contextmenu` handler is attached — nothing opens, and a test
 * that right-clicked exactly once then waits 30s for a menu that will never
 * come. The init tail can also close a menu that did open (~100–200ms after
 * opening; see TD-100's write-up for the suspected `moveend` →
 * `panInsideMaxBounds` → `movestart` cascade). A real DM shrugs and
 * right-clicks again, so the test does the same. This does not mask a
 * persistent regression: if the menu keeps dying, every retry fails and
 * `toPass` exhausts.
 */
async function openContextMenu(
  page: Page,
  position: { x: number; y: number }
): Promise<Locator> {
  const map = page.locator(".leaflet-container");
  const menu = page.getByLabel(messages.geography.contextMenu.ariaLabel);
  await expect(async () => {
    await map.click({ button: "right", position });
    await expect(menu).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15000 });
  return menu;
}

test.describe("world map", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/geography");
    await expect(page.locator(".leaflet-container")).toBeVisible();
  });

  test("the map mounts and renders its artwork", async ({ page }) => {
    // A mounted-but-imageless map is the failure mode worth catching: it looks
    // like a grey box and throws nothing.
    const overlay = page.locator(imageLayer);
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveAttribute("src", /\/api\/maps\/.+\/image$/);
  });

  test("right-clicking the map opens the context menu", async ({ page }) => {
    const menu = await openContextMenu(page, { x: 300, y: 200 });
    await expect(
      menu.getByText(messages.geography.contextMenu.addMarker.trigger, {
        exact: true,
      })
    ).toBeVisible();
    // "Copia coordinate" is gone (TD-96) — the DM saw no purpose for a raw
    // pixel pair under CRS.Simple. Measure is the entry that survives it.
    //
    // `exact: true` is load-bearing here, not defensive boilerplate:
    // Playwright's `getByText` substring-matches by default, and the
    // Measure item's own sublabel is "Avvia la misurazione della
    // distanza" — which contains "misura" (the first six letters of
    // "misurazione"). Without `exact`, this locator resolves to both the
    // trigger label and the sublabel and throws a strict-mode violation.
    // Caught 2026-08-18 (CI run 32167830767) when TD-96 swapped this
    // assertion from the now-removed "Copia coordinate" (no such
    // collision) to "Misura".
    await expect(
      menu.getByText(messages.geography.contextMenu.measure.trigger, {
        exact: true,
      })
    ).toBeVisible();
  });

  // TD-68: MapPOIPanel's desktop Close button and the hero-image gradient
  // overlay behind it shared `z-10`, so the overlay (later in DOM order)
  // painted on top and silently swallowed every click at the button's own
  // position — invisible to a test that calls the click handler directly.
  // Playwright's `.click()` verifies the click point actually resolves to
  // the target element before dispatching, so this would have failed with
  // a "subtree intercepts pointer events" timeout under the old z-index.
  test("clicking the visible Close button closes the desktop POI panel", async ({
    page,
  }) => {
    const menu = await openContextMenu(page, { x: 400, y: 250 });
    await menu
      .getByRole("button", {
        name: messages.geography.contextMenu.addPlace.trigger,
      })
      .click();

    const closeButton = page.getByRole("button", { name: "Close" });
    await expect(closeButton).toBeVisible();

    const panel = closeButton.locator("xpath=..");
    await expect(panel).not.toHaveClass(/-translate-x-full/);

    await closeButton.click();

    await expect(panel).toHaveClass(/-translate-x-full/);
  });
});

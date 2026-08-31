import { expect, type Locator, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * Opening the map's context menu — and *using* it — has to be retried
 * (TD-100).
 *
 * `.leaflet-container` becoming visible is not "the map is ready". On a slow
 * environment (CI runners, chiefly) the map's initialisation tail is still
 * running, and it interferes with the menu in two distinct ways, both
 * recorded in TD-100's write-up from PR #215:
 *
 * - the first right-click can land *before* Leaflet's `contextmenu` handler
 *   is attached — nothing opens, and a test that right-clicked exactly once
 *   then waits its full timeout for a menu that will never come;
 * - a menu that *did* open could be closed from under the test ~100–200ms
 *   later, by the suspected `invalidateSize` → `moveend` →
 *   `panInsideMaxBounds` → `movestart` cascade. **This one is fixed in the
 *   app**: since TD-100 the menu closes on `dragstart`/`zoomstart` — what the
 *   DM did — and no longer on `movestart`, so no camera move the app makes on
 *   its own can take the menu away.
 *
 * A real DM shrugs and right-clicks again, so these helpers do the same.
 * This does not mask a persistent regression: if the menu keeps dying, every
 * retry fails and `toPass` exhausts.
 *
 * **The second signature is why `chooseFromContextMenu` exists.** TD-100's
 * original helper retried only the *opening* and returned as soon as the
 * menu was visible, which leaves the window between "visible" and "the item
 * is clicked" unguarded — and that is exactly where CI landed on 2026-08-27
 * (run 33113909995): the menu opened, "Aggiungi luogo" resolved, then went
 * unstable and detached mid-click, three attempts running. Retrying the open
 * alone cannot recover from that, because by then the helper has already
 * returned. So the open *and* the click on the item are one retried unit.
 *
 * Prefer `chooseFromContextMenu` wherever a test only wants to act on the
 * menu. `openContextMenu` is for the tests that assert on the menu's own
 * contents before deciding what to do with it — those reads cannot go inside
 * the retry without a genuine assertion failure being retried away.
 *
 * **Why the retries stay now that TD-100 is fixed.** The fix answers the
 * second signature and the whole class it belonged to, but it cannot answer
 * the first: a right-click that lands before Leaflet has attached its
 * `contextmenu` handler opens nothing, and only clicking again can. Deleting
 * the retries would re-hostage CI on that alone — and they cost nothing when
 * the first attempt works, which is every run locally.
 */

/** The context menu itself, open or not. */
export function contextMenu(page: Page): Locator {
  return page.getByLabel(messages.geography.contextMenu.ariaLabel);
}

/**
 * Right-click the map at `position` until the menu is actually open, and
 * return it. Use this only when the menu's contents are the assertion; if the
 * test just wants to pick an entry, use `chooseFromContextMenu`.
 */
export async function openContextMenu(
  page: Page,
  position: { x: number; y: number }
): Promise<Locator> {
  const map = page.locator(".leaflet-container");
  const menu = contextMenu(page);

  await expect(async () => {
    await map.click({ button: "right", position });
    await expect(menu).toBeVisible({ timeout: 1500 });
  }).toPass({ timeout: 15000 });

  return menu;
}

/**
 * Right-click the map at `position` and click the menu entry named
 * `itemName`, retrying the pair as one unit so a menu that dies between
 * opening and being clicked is simply re-opened.
 *
 * `itemName` is matched as an accessible name, substring and
 * case-insensitively — Playwright's default — which is what lets
 * "Posiziona luogo (3)" be found by its label alone.
 */
export async function chooseFromContextMenu(
  page: Page,
  position: { x: number; y: number },
  itemName: string
): Promise<void> {
  const map = page.locator(".leaflet-container");
  const menu = contextMenu(page);

  await expect(async () => {
    await map.click({ button: "right", position });
    await expect(menu).toBeVisible({ timeout: 1500 });
    // A short click timeout on purpose: the point is to give up on *this*
    // menu quickly and open a fresh one, not to spend the test's whole
    // budget waiting for an element that has already detached.
    await menu.getByRole("button", { name: itemName }).click({ timeout: 2000 });
  }).toPass({ timeout: 15000 });
}

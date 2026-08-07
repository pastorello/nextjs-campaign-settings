import { test, expect } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * TD-70: `MapPOIPanel`'s "Add Place" flow (SPEC-004 M5) lets a DM give a
 * `deity` or `npc` real coordinates, but until `useLinkedEntityMarkers`
 * nothing ever drew that pin on the map — there was no rendering path for
 * either kind at all, not a bug in an existing one.
 *
 * The panel's own copy is hardcoded English (no `next-intl` in
 * `MapPOIPanel.tsx` yet), so this spec asserts against those literal
 * strings for the panel, and against the `it.json` catalogue for the
 * deities admin pages, matching `map-poi-link.spec.ts`'s convention.
 */
test.describe("linked entity markers", () => {
  test("a deity placed through Add Place renders as a clickable marker linking to its page", async ({
    page,
  }) => {
    const deityName = `E2E linked deity ${Date.now()}`;

    await page.goto("/dashboard/admin/deities");
    await page
      .getByRole("link", { name: messages.deities.page.newItemButton })
      .click();
    await expect(
      page.getByRole("heading", { name: messages.deities.form.createTitle })
    ).toBeVisible();
    await page.getByLabel(messages.common.fields.name.label).fill(deityName);
    await page
      .getByRole("button", { name: messages.deities.form.createButton })
      .click();
    await page.waitForURL("**/dashboard/admin/deities");

    await page.goto("/dashboard/geography");
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible();

    await map.click({ button: "right", position: { x: 700, y: 300 } });
    await page.getByRole("button", { name: /Add Place/ }).click();

    const kindSelect = page
      .locator("label", { hasText: "Kind" })
      .locator("xpath=following-sibling::select[1]");
    await kindSelect.selectOption("deity");

    await page.getByPlaceholder("Enter place name").fill(deityName);

    const linkedEntitySelect = page
      .locator("select")
      .filter({ has: page.locator("option", { hasText: "Select…" }) });
    await expect(
      linkedEntitySelect.locator("option", { hasText: deityName })
    ).toBeAttached();
    await linkedEntitySelect.selectOption({ label: deityName });

    await page.getByRole("button", { name: "Save" }).click();

    const marker = page.locator(".custom-linked-entity-marker").first();
    await expect(marker).toBeVisible();
    // A real `.click()` (move-then-mousedown-then-mouseup) reliably fails to
    // open Leaflet's bound popup here — Leaflet's own map-drag handler reads
    // Playwright's synthetic mouse movement into position as the start of a
    // pan and suppresses the click it would otherwise forward to the marker.
    // `dispatchEvent` fires the DOM 'click' Leaflet actually listens for
    // without going through that drag-detection path — the same reason the
    // sibling POI-popup test (`map-poi-link.spec.ts`) never clicks a marker
    // directly either, using `flyToPOI`'s `openPopup()` call instead.
    await marker.dispatchEvent("click");

    const popupLink = page
      .locator(".leaflet-popup-content")
      .getByRole("link", { name: "View Deity" });
    await expect(popupLink).toBeVisible();
    await expect(popupLink).toHaveAttribute(
      "href",
      /^\/dashboard\/deities\?id=\d+$/
    );

    // Clean up. The place itself is left behind for the same reason
    // map-poi-link.spec.ts leaves its POI: there's no way back into
    // MapPOIPanel once navigated away, and fetchPlaceChildren already
    // handles a stale/orphaned linkedId gracefully.
    await page.goto(
      `/dashboard/admin/deities?query=${encodeURIComponent(deityName)}`
    );
    const deityRow = page.getByRole("row").filter({ hasText: deityName });
    await deityRow
      .getByRole("button", { name: messages.common.form.delete })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: messages.common.form.delete })
      .click();
    await expect(deityRow).toHaveCount(0);
  });
});

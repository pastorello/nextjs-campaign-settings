import { test, expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * TD-14 T6 (SPEC-002 §5): a POI linked to an NPC or deity gains a
 * "View <type>" link in its marker popup. There is no dedicated per-entity
 * detail route for NPCs/deities — the link points at that entity's list page
 * filtered by the existing exact-match `?id=` param (`getQuery.ts`), the same
 * mechanism `EntityLibrary` already supports for every domain.
 *
 * The panel's own copy is hardcoded English today (no `next-intl` in
 * `MapPOIPanel.tsx` yet — pre-existing, not part of this change), so this
 * spec asserts against those literal strings rather than the `it.json`
 * catalogue, unlike the rest of this suite.
 */
const gotoNpcAdmin = async (page: Page, query: string) => {
  await page.goto(`/dashboard/admin/npc?query=${encodeURIComponent(query)}`);
};

const npcRow = (page: Page, name: string) =>
  page.getByRole("row").filter({ hasText: name });

test.describe("POI linked-entity popup link", () => {
  test("a POI linked to an NPC shows a working View NPC link", async ({
    page,
  }) => {
    const npcName = `E2E POI link ${Date.now()}`;
    const poiTitle = `E2E POI ${Date.now()}`;

    // Create an NPC to link the POI to.
    await page.goto("/dashboard/admin/npc");
    await page
      .getByRole("link", { name: messages.npc.page.newItemButton })
      .click();
    await expect(
      page.getByRole("heading", { name: messages.npc.form.createTitle })
    ).toBeVisible();
    await page.getByLabel(messages.common.fields.name.label).fill(npcName);
    await page
      .getByRole("button", { name: messages.npc.form.createButton })
      .click();
    await page.waitForURL("**/dashboard/admin/npc");

    await page.goto("/dashboard/geography");
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible();
    await map.click({ button: "right", position: { x: 700, y: 300 } });
    await page.getByRole("button", { name: /Add Place/ }).click();

    await page.getByPlaceholder("Enter place name").fill(poiTitle);

    const linkedTypeSelect = page
      .locator("select")
      .filter({ has: page.locator("option", { hasText: "None" }) });
    await linkedTypeSelect.selectOption("npc");

    const linkedEntitySelect = linkedTypeSelect.locator(
      "xpath=following-sibling::select[1]"
    );
    await expect(
      linkedEntitySelect.locator("option", { hasText: npcName })
    ).toBeAttached();
    await linkedEntitySelect.selectOption({ label: npcName });

    await page.getByRole("button", { name: "Save" }).click();

    // This DB isn't empty — other POIs already exist, so a marker can't be
    // picked out by CSS class alone. Instead, use the list panel's own
    // "fly to" (`usePOIManager.flyToPOI`), which pans to the exact POI by its
    // (uniquely timestamped) title and opens its popup — the same mechanism
    // `POIListItem`'s click already exercises today, just driven from here.
    const poiListButton = page.locator("button", { hasText: poiTitle }).first();
    await expect(poiListButton).toBeVisible();
    await poiListButton.click();

    const popupLink = page
      .locator(".leaflet-popup-content")
      .getByRole("link", { name: "View NPC" });
    await expect(popupLink).toBeVisible();
    await expect(popupLink).toHaveAttribute(
      "href",
      /^\/dashboard\/npc\?id=\d+$/
    );

    // A real anchor, not client-side routing — the popup is plain HTML
    // injected outside the React tree (usePOIManager's createMarker).
    await popupLink.click();
    await page.waitForURL(/\/dashboard\/npc\?id=\d+/);
    await expect(page.getByText(npcName)).toBeVisible();

    // Clean up the NPC. The POI itself is left behind: `WorldMap.tsx` only
    // opens `MapPOIPanel` from the right-click "Add Place" flow (its
    // search-bar entry point is commented out — a pre-existing, deliberately
    // unwired MVP gap, see CLAUDE.md "unused is not dead"), so once this
    // navigates away there is no way back into the panel that held the
    // delete button. SPEC-002 already treats an orphaned `linkedId` as an
    // expected, handled case (`fetchPois` degrades it to unlinked), and the
    // POI itself needs no such handling — it just outlives the NPC.
    await gotoNpcAdmin(page, npcName);
    await npcRow(page, npcName)
      .getByRole("button", { name: messages.common.form.delete })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: messages.common.form.delete })
      .click();
    await expect(npcRow(page, npcName)).toHaveCount(0);
  });
});

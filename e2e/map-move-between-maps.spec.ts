import { test, expect, type Locator } from "@playwright/test";
import messages from "@/messages/it.json";

import {
  chooseFromContextMenu,
  openContextMenu,
} from "./helpers/mapContextMenu";

/**
 * SPEC-017 T11 — the capability the whole spec exists for: **moving a place
 * from one map to another**, which the application could not do at all.
 * "Posiziona luogo" offered only the children of the map in view, so a place
 * parked under the wrong parent was stuck there for good.
 *
 * The flow this walks is the one a DM walks: un-place the thing, open the
 * other map, pick it out of the pool. Nothing here reaches around the app to
 * seed a row — every state it needs is reached through the UI, which is why
 * the setup is long.
 *
 * It also proves the invariant no unit test can prove end to end
 * (ADR-0010): an NPC standing at a landmark carries that landmark's zone, so
 * when the landmark changes map the NPC's own `zoneId` has to follow. The
 * proof is the admin list's location filter, which keys on `zoneId` — the
 * *column* would not do, since it displays the landmark's title and that
 * never changes.
 *
 * **Why the cycle refusal (T5) is not here.** It is unreachable from the UI
 * by design: T9 leaves a map's own ancestors out of the picker, so the DM is
 * never offered the pick that would be refused. Reaching the refusal through
 * the UI would mean opening an unplaced ancestor's map from cross-entity
 * search — SPEC-011's path, not this one. The rule is covered where it
 * lives: `checkTreePlacement.test.ts` for the rule, `placeZone.test.ts` for
 * the refusal, `WorldMap.test.tsx` for the rows never being offered.
 */
const PNG_FILE = {
  name: "region.png",
  mimeType: "image/png",
  buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
};

const locationModal = messages.common.locationModal;
const formSelectButton = (dialog: Locator, index: number) =>
  dialog.getByTestId("form-select").nth(index).getByRole("button");

test.describe("moving a place from one map to another (SPEC-017)", () => {
  test("moves a landmark to another map, and the NPC standing at it follows", async ({
    page,
  }) => {
    const stamp = Date.now();
    const npcName = `E2E move npc ${stamp}`;
    const fromTitle = `E2E move from ${stamp}`;
    const toTitle = `E2E move to ${stamp}`;
    const landmarkTitle = `E2E move landmark ${stamp}`;

    // 1. An NPC to stand at the landmark.
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

    // 2. Two maps to move between, both children of the root.
    await page.goto("/dashboard/geography");
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible();
    // The image overlay's interim-then-corrective refit (TD-81/TD-87) has to
    // settle before anything coordinate-sensitive, as `map-unplace` documents.
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);

    const navigableMarkers = page.locator(".custom-navigable-marker");
    const landmarkMarkers = page.locator(".custom-poi-marker");

    // Returns the new marker's index. Markers render in `createdAt` order
    // (`fetchPlaceChildren`), and a navigable marker carries its title only
    // in a Leaflet tooltip — no text to select on — so the index taken at
    // creation is how a specific one is reached again. The popover's own
    // accessible name is asserted on arrival, so a wrong index fails there
    // rather than silently descending into someone else's map.
    const addRegion = async (title: string, at: { x: number; y: number }) => {
      const before = await navigableMarkers.count();
      await chooseFromContextMenu(
        page,
        at,
        messages.geography.contextMenu.addPlace.trigger
      );
      await page
        .locator("label", { hasText: "Kind" })
        .locator("xpath=following-sibling::select[1]")
        .selectOption("region");
      await page
        .locator('input[type="file"][accept*="image"]')
        .setInputFiles(PNG_FILE);
      await page.getByPlaceholder("Enter place name").fill(title);
      await page.getByRole("button", { name: "Save" }).click();
      await expect(navigableMarkers).toHaveCount(before + 1);
      // The panel stays open over the map's left edge; leave it open and the
      // marker just created is occluded and unclickable.
      await page.getByRole("button", { name: "Close", exact: true }).click();
      return before;
    };

    const descendInto = async (index: number, title: string) => {
      await navigableMarkers.nth(index).click();
      const target = page.getByRole("dialog", { name: title });
      await expect(target).toBeVisible();
      await target
        .getByRole("button", { name: messages.geography.popover.openMap })
        .click();
      await expect(map).toBeVisible();
      await page.waitForLoadState("networkidle");
      await page.waitForTimeout(300);
    };

    const fromIndex = await addRegion(fromTitle, { x: 500, y: 200 });
    const toIndex = await addRegion(toTitle, { x: 260, y: 360 });

    // 3. A landmark on the first map.
    await descendInto(fromIndex, fromTitle);
    await chooseFromContextMenu(
      page,
      { x: 420, y: 260 },
      messages.geography.contextMenu.addPlace.trigger
    );
    await page.getByPlaceholder("Enter place name").fill(landmarkTitle);
    await page.getByRole("button", { name: "Save" }).click();
    await page.getByRole("button", { name: "Close", exact: true }).click();
    await expect(landmarkMarkers).toHaveCount(1);

    // 4. Stand the NPC at that landmark — zone *and* landmark, which is the
    //    pair ADR-0010 requires to stay in agreement.
    await page.goto(
      `/dashboard/admin/npc?query=${encodeURIComponent(npcName)}`
    );
    const row = page.getByRole("row").filter({ hasText: npcName });
    await expect(row).toBeVisible();
    await row
      .getByRole("button", { name: messages.common.table.assignLocation })
      .click();
    const assignDialog = page.getByRole("dialog");
    await formSelectButton(assignDialog, 0).click();
    await assignDialog.getByRole("option", { name: fromTitle }).click();
    await formSelectButton(assignDialog, 1).click();
    await assignDialog.getByRole("option", { name: landmarkTitle }).click();
    await assignDialog
      .getByRole("button", { name: messages.common.form.save })
      .click();
    await expect(assignDialog).toHaveCount(0);

    // 5. Un-place the landmark (SPEC-017 T10) — the pool's only door for a
    //    landmark, and the first half of a move.
    await page.goto("/dashboard/geography");
    await expect(map).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);
    await descendInto(fromIndex, fromTitle);

    const landmarkPopover = page.getByRole("dialog", { name: landmarkTitle });
    await expect(async () => {
      await landmarkMarkers.last().click();
      await expect(landmarkPopover).toBeVisible({ timeout: 500 });
    }).toPass({ timeout: 10_000 });
    await landmarkPopover
      .getByRole("button", { name: messages.geography.popover.unplace })
      .click();
    await expect(landmarkMarkers).toHaveCount(0);

    // 6. Up, then into the *other* map, and the pool offers it there — the
    //    whole point: before this spec, that list held only this map's own
    //    children and the landmark was unreachable from here.
    await page.getByRole("button", { name: messages.geography.up }).click();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);
    await descendInto(toIndex, toTitle);

    const menu = await openContextMenu(page, { x: 400, y: 300 });
    await menu
      .getByRole("button", {
        name: messages.geography.contextMenu.positionPlace.trigger,
      })
      .click();
    await expect(menu.getByText(landmarkTitle)).toBeVisible();
    // Named where it comes from, before the click that moves it (T9).
    await expect(
      menu.getByText(`da «${fromTitle}»`, { exact: false })
    ).toBeVisible();

    await menu.getByText(landmarkTitle).click();

    // 7. It is on this map now. A landmark renders only on the map of its
    //    own zone (`fetchPlaceChildren` reads `poi.zoneId`), so the marker
    //    being here *is* the tree edge having been rewritten.
    await expect(landmarkMarkers).toHaveCount(1);

    // 8. And the NPC came with it. The location *column* would not prove
    //    this — it shows the landmark's title, which never changed — but the
    //    filter keys on `zoneId`, so the NPC can only appear under the new
    //    map if `placeLandmark` carried it there (ADR-0010, SPEC-017 T6).
    await page.goto("/dashboard/admin/npc");
    const zoneFilter = page.getByLabel(locationModal.zoneLabel);
    await zoneFilter.selectOption({ label: toTitle });
    const npcRow = page.getByRole("row").filter({ hasText: npcName });
    await expect(npcRow).toBeVisible();

    // And the same assertion the other way round, so the one above cannot
    // pass by the filter having quietly done nothing: under the map the
    // landmark *left*, the NPC is gone.
    await zoneFilter.selectOption({ label: fromTitle });
    await expect(npcRow).toHaveCount(0);
  });
});

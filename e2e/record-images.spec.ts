import { test, expect, type Locator, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import messages from "@/messages/it.json";

import { chooseFromContextMenu } from "./helpers/mapContextMenu";
import { portraitPng as portrait } from "./helpers/portraitPng";

/**
 * An NPC's portrait end to end (SPEC-020 T4, T6): uploaded through the
 * form's image field, shown as a thumbnail in the admin list and on the
 * public card, and — per the DM's 2026-09-19 revision of T5 — beside the
 * NPC's name in a landmark popover's list of who is there; then removed.
 */
const IMAGE_LABEL = messages.common.fields.image.label;
const ADMIN_NPC = "/dashboard/dnd5e/admin/npc";

/** See spells-crud.spec.ts: a new record is not on page 1 of a real library. */
const gotoAdminList = async (page: Page, name: string) => {
  await page.goto(`${ADMIN_NPC}?query=${encodeURIComponent(name)}`);
  // Row buttons open client-side dialogs; a click that lands before
  // hydration is swallowed.
  await page.waitForLoadState("networkidle");
};

const rowFor = (page: Page, name: string) =>
  page.getByRole("row").filter({ hasText: name });

/** Loaded, not merely present: the authenticated route actually served it. */
const expectLoaded = async (img: Locator) => {
  await expect(img).toBeVisible();
  await expect
    .poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);
};

/** Creates an NPC with a portrait through the create form. */
const createNpcWithPortrait = async (page: Page, name: string) => {
  await page.goto(ADMIN_NPC);
  await page
    .getByRole("link", { name: messages.npc.page.newItemButton })
    .click();
  await expect(
    page.getByRole("heading", { name: messages.npc.form.createTitle })
  ).toBeVisible();

  await page.getByLabel(messages.common.fields.name.label).fill(name);
  await page
    .getByLabel(IMAGE_LABEL, { exact: true })
    .setInputFiles(await portrait());
  // Uploaded on choice: the preview is the route's answer, not the file.
  await expectLoaded(
    page.getByRole("img", { name: messages.common.fields.image.previewAlt })
  );
  await page
    .getByRole("button", { name: messages.npc.form.createButton })
    .click();
  await page.waitForURL(`**${ADMIN_NPC}`);
};

/** Deletes the NPC's row if it exists — safe to run from `finally`. */
const deleteNpcIfPresent = async (page: Page, name: string) => {
  await gotoAdminList(page, name);
  if ((await rowFor(page, name).count()) === 0) return;
  await rowFor(page, name)
    .getByRole("button", { name: messages.common.form.delete })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: messages.common.form.delete })
    .click();
  await expect(rowFor(page, name)).toHaveCount(0);
};

const gotoMap = async (page: Page) => {
  await page.goto("/dashboard/dnd5e/geography");
  await expect(page.locator(".leaflet-container")).toBeVisible();
  // The image-overlay bootstrap refits the camera once after an interim
  // framing (TD-81/TD-87); see map-landmark-popover.spec.ts.
  await page.waitForLoadState("networkidle");
  await page.waitForTimeout(300);
};

/**
 * Opens the landmark's popover by its marker, retrying the click: the
 * popover refuses to open until `createPoi`'s round trip has given the
 * marker a real id (map-landmark-popover.spec.ts).
 */
const openLandmarkPopover = async (page: Page, title: string) => {
  const popover = page.getByRole("dialog", { name: title });
  await expect(async () => {
    await page.getByRole("button", { name: title, exact: true }).click();
    await expect(popover).toBeVisible({ timeout: 500 });
  }).toPass({ timeout: 10_000 });
  return popover;
};

/** Deletes the landmark through its popover if its marker exists. */
const deleteLandmarkIfPresent = async (page: Page, title: string) => {
  await gotoMap(page);
  const marker = page.getByRole("button", { name: title, exact: true });
  if ((await marker.count()) === 0) return;
  const popover = await openLandmarkPopover(page, title);
  await popover
    .getByRole("button", { name: messages.geography.popover.deleteLandmark })
    .click();
  // Scoped to the confirm dialog: its "Elimina" collides with the popover's
  // own trigger, still mounted underneath (TD-140).
  await page
    .getByRole("dialog")
    .filter({
      hasText: messages.geography.popover.deleteLandmarkConfirm.cancel,
    })
    .getByRole("button", {
      name: messages.geography.popover.deleteLandmarkConfirm.confirm,
    })
    .click();
  await expect(marker).toHaveCount(0);
};

test.describe("Record images", () => {
  test("an NPC's portrait shows in the list and on the card, and can be removed", async ({
    page,
  }) => {
    const name = `E2E PNG ritratto ${Date.now()}`;

    try {
      await createNpcWithPortrait(page, name);

      // The admin list's row thumbnail.
      await gotoAdminList(page, name);
      await expectLoaded(rowFor(page, name).getByRole("img", { name }));

      // The public card's thumbnail.
      await page.goto(`/dashboard/dnd5e/npc?query=${encodeURIComponent(name)}`);
      await expectLoaded(page.getByRole("img", { name }).first());

      // Removed through the edit dialog: the row falls back to its
      // placeholder.
      await gotoAdminList(page, name);
      await rowFor(page, name)
        .getByRole("button", { name: messages.common.table.edit })
        .click();
      const editDialog = page.getByRole("dialog");
      await editDialog
        .getByRole("button", {
          name: messages.common.fields.image.remove,
          exact: true,
        })
        .click();
      await editDialog
        .getByRole("button", { name: messages.npc.form.editButton })
        .click();
      await expect(editDialog).toHaveCount(0);

      await gotoAdminList(page, name);
      await expect(rowFor(page, name).getByRole("img")).toHaveCount(0);
      await expect(
        rowFor(page, name).getByTestId("record-thumbnail-placeholder")
      ).toBeVisible();
    } finally {
      await deleteNpcIfPresent(page, name);
    }
  });

  /**
   * SPEC-020 T5 as revised by the DM (2026-09-19): an NPC or deity has no
   * pin of its own since SPEC-008 T8, so its portrait shows in the popover's
   * list of who is at a place. Attached here through the popover's own
   * "Collega personaggio", the path a DM takes.
   */
  test("an NPC's portrait shows beside its name in a landmark's popover", async ({
    page,
  }) => {
    const stamp = Date.now();
    const name = `E2E PNG ritratto mappa ${stamp}`;
    const title = `E2E landmark ritratto ${stamp}`;

    try {
      await createNpcWithPortrait(page, name);

      // A landmark (`kind: "poi"`, the panel's default: no map image).
      await gotoMap(page);
      await chooseFromContextMenu(
        page,
        { x: 460, y: 320 },
        messages.geography.contextMenu.addPlace.trigger
      );
      await page
        .getByPlaceholder(messages.geography.poiPanel.placeholders.placeName)
        .fill(title);
      await page
        .getByRole("button", { name: messages.geography.poiPanel.save.save })
        .click();
      // The panel stays open over the map's left edge after save; close it
      // or the new marker may be occluded.
      await page
        .getByRole("button", {
          name: messages.geography.poiPanel.close,
          exact: true,
        })
        .click();

      const popover = await openLandmarkPopover(page, title);
      await expect(
        popover.getByText(messages.geography.popover.entitiesEmpty)
      ).toBeVisible();

      // Attach the NPC from the popover: type, then the NPC itself, then the
      // location modal, pre-filled with this landmark.
      await popover
        .getByRole("button", { name: messages.geography.popover.attach })
        .click();
      const attachDialog = page.getByRole("dialog", {
        name: messages.geography.attachEntity.trigger,
      });
      const selects = attachDialog.locator("select");
      await selects.first().selectOption("npc");
      await expect(
        selects.nth(1).locator("option", { hasText: name })
      ).toHaveCount(1);
      await selects.nth(1).selectOption({ label: name });
      await page
        .getByRole("dialog")
        .getByRole("button", { name: messages.common.form.save })
        .click();

      // The list refetches after the attach; the row carries the portrait.
      const row = popover.getByRole("listitem").filter({ hasText: name });
      await expectLoaded(row.getByRole("img", { name }));

      // A populated list, portrait included, passes axe — the a11y spec's
      // own popover scan only reaches the empty state.
      const results = await new AxeBuilder({ page })
        .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
        .include('[role="dialog"]')
        .analyze();
      expect(
        results.violations.map(
          (violation) => `${violation.id} (${violation.nodes.length} nodes)`
        ),
        "axe violations on the popover's entity list"
      ).toEqual([]);
    } finally {
      // The NPC first: `npc.poiId` is `onDelete: Restrict`, so a landmark
      // with an NPC still attached refuses to be deleted.
      await deleteNpcIfPresent(page, name);
      await deleteLandmarkIfPresent(page, title);
    }
  });
});

import { test, expect, type Locator } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import messages from "@/messages/it.json";
import { openContextMenu } from "./helpers/mapContextMenu";

/**
 * SPEC-026 — the DM is writing up a character who drinks at a tavern that
 * does not exist yet. Creating it from the location picker must select it,
 * so saving attaches the character there without a detour, and the tavern
 * must then be waiting in its parent's unplaced pool (§5.4) — which is also
 * how this spec cleans up: it places the tavern from the pool and deletes it
 * through the landmark popover, as the other landmark specs do.
 */
const locationModal = messages.common.locationModal;

const selectButton = (scope: Locator, index: number) =>
  scope.getByTestId("form-select").nth(index).getByRole("button");

test.describe("create a place without leaving the flow (SPEC-026)", () => {
  test("creates a landmark from an NPC's location picker, attaches the NPC to it, and leaves it unplaced", async ({
    page,
  }) => {
    const stamp = Date.now();
    const npcName = `E2E SPEC-026 PNG ${stamp}`;
    const placeTitle = `E2E SPEC-026 taverna ${stamp}`;

    await page.goto("/dashboard/dnd5e/admin/npc/new");
    await expect(
      page.getByRole("heading", { name: messages.npc.form.createTitle })
    ).toBeVisible();
    await page.getByLabel(messages.common.fields.name.label).fill(npcName);
    await page
      .getByRole("button", { name: messages.npc.form.createButton })
      .click();
    await page.waitForURL("**/dashboard/dnd5e/admin/npc");

    await page.goto(
      `/dashboard/dnd5e/admin/npc?query=${encodeURIComponent(npcName)}`
    );
    const row = page.getByRole("row").filter({ hasText: npcName });
    await expect(row).toBeVisible();
    await row
      .getByRole("button", { name: messages.common.table.assignLocation })
      .click();
    const dialog = page.getByRole("dialog");

    // The picker offers to create the place instead of finding it.
    await dialog
      .getByRole("button", { name: locationModal.createPlace })
      .click();
    const form = dialog.getByRole("region", {
      name: messages.geography.createPlace.title,
    });
    await expect(form).toBeVisible();
    // §8: labelled fields, no violations in the dialog with the form open.
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .include('[role="dialog"]')
      .analyze();
    expect(
      results.violations.map((v) => `${v.id} (${v.nodes.length} nodes)`),
      "axe violations in the location dialog with the create form open"
    ).toEqual([]);
    await form
      .getByLabel(messages.geography.fields.title.label)
      .fill(placeTitle);

    // A new NPC has no location, so no parent can be inferred and none is
    // chosen for the DM (§5): pick the world's root, which `world.setup`
    // names "E2E World <stamp>". Scoped to the open listbox: the page has
    // native <option>s of its own (the system and locale switchers).
    await selectButton(form, 1).click();
    await page
      .getByRole("listbox")
      .getByRole("option", { name: /^E2E World / })
      .click();
    await form
      .getByRole("button", { name: messages.geography.createPlace.create })
      .click();

    // §5.3: the new landmark is the one selected; saving attaches the NPC.
    await expect(form).toHaveCount(0);
    await expect(selectButton(dialog, 1)).toContainText(placeTitle);
    await dialog
      .getByRole("button", { name: messages.common.form.save })
      .click();
    await expect(dialog).toHaveCount(0);
    await expect(row).toContainText(placeTitle);

    // §5.4: it has no position, and waits in its parent's pool.
    await page.goto("/dashboard/dnd5e/geography");
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);
    const positionPlace = messages.geography.contextMenu.positionPlace;
    const openPool = async (point: { x: number; y: number }) => {
      const menu = await openContextMenu(page, point);
      await menu.getByRole("button", { name: positionPlace.trigger }).click();
      return menu;
    };
    const deleteLandmark = async (title: string) => {
      const marker = page.getByRole("button", { name: title, exact: true });
      const popover = page.getByRole("dialog", { name: title, exact: true });
      await expect(async () => {
        await marker.click();
        await expect(popover).toBeVisible({ timeout: 500 });
      }).toPass({ timeout: 10_000 });
      await popover
        .getByRole("button", {
          name: messages.geography.popover.remove,
          exact: true,
        })
        .click();
      await page
        .getByRole("radio", {
          name: messages.geography.removeLandmark.outcomes.deleteLabel,
        })
        .click();
      await page
        .getByRole("button", {
          name: messages.geography.removeLandmark.confirm,
        })
        .click();
      await expect(marker).toHaveCount(0);
    };

    let menu = await openPool({ x: 520, y: 360 });
    await expect(menu.getByText(placeTitle)).toBeVisible();

    // T4: the pool's filter offers to add a name it does not find, right
    // where the menu opened, through "Aggiungi luogo" with the name typed.
    const shopTitle = `E2E SPEC-026 bottega ${stamp}`;
    await menu.getByLabel(positionPlace.filter).fill(shopTitle);
    await menu
      .getByRole("button", {
        name: positionPlace.createNamed.replace("{title}", shopTitle),
      })
      .click();
    await expect(menu).toBeHidden();
    await expect(
      page.getByPlaceholder(messages.geography.poiPanel.placeholders.placeName)
    ).toHaveValue(shopTitle);
    await page
      .getByRole("button", { name: messages.geography.poiPanel.save.save })
      .click();
    await page
      .getByRole("button", {
        name: messages.geography.poiPanel.close,
        exact: true,
      })
      .click();
    await expect(
      page.getByRole("button", { name: shopTitle, exact: true })
    ).toBeVisible();
    await deleteLandmark(shopTitle);

    // Cleanup: place the tavern from the pool, check the NPC came with it,
    // then delete it through its popover.
    menu = await openPool({ x: 600, y: 300 });
    await menu.getByText(placeTitle).click();
    await expect(menu).toBeHidden();
    const popover = page.getByRole("dialog", {
      name: placeTitle,
      exact: true,
    });
    await expect(async () => {
      await page.getByRole("button", { name: placeTitle, exact: true }).click();
      await expect(popover).toBeVisible({ timeout: 500 });
    }).toPass({ timeout: 10_000 });
    await expect(popover.getByText(npcName)).toBeVisible();
    await page.keyboard.press("Escape");
    await deleteLandmark(placeTitle);

    await page.goto(
      `/dashboard/dnd5e/admin/npc?query=${encodeURIComponent(npcName)}`
    );
    await row
      .getByRole("button", { name: messages.common.form.delete })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: messages.common.form.delete })
      .click();
    await expect(row).toHaveCount(0);
  });
});

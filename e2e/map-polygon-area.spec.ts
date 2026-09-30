import { test, expect, type Page } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

import messages from "@/messages/it.json";
import {
  chooseFromContextMenu,
  openContextMenu,
} from "./helpers/mapContextMenu";

/**
 * SPEC-024 — an area is a polygon drawn one click per vertex. The shape here
 * is an L: concave, so its bounding box covers ground the area does not, and
 * the map's containment has to follow the outline rather than the box. The
 * proof is the right-click menu: "Aggiungi luogo" is withheld inside an
 * area (SPEC-009 T4) — which runs `footprintContains` — and must be offered
 * in the L's notch, inside the box but outside the shape.
 *
 * The area needs a map image to be saved, like any navigable place: the same
 * minimal PNG `map-place-unplaced-landmark.spec.ts` uploads.
 */
const PNG_FILE = {
  name: "area.png",
  mimeType: "image/png",
  buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
};

// Fractions of the map image's own box, so every vertex lies inside the
// map's bounds — a vertex outside is clamped to them (SPEC-024 §5), which
// would flatten the shape. Right of centre, clear of the pin other specs
// leave in the middle: an L whose notch is the top-right quarter of its box.
const L_SHAPE = [
  { x: 0.6, y: 0.15 },
  { x: 0.8, y: 0.15 },
  { x: 0.8, y: 0.3 },
  { x: 0.7, y: 0.3 },
  { x: 0.7, y: 0.45 },
  { x: 0.6, y: 0.45 },
];
const IN_THE_ARM = { x: 0.64, y: 0.38 };
const IN_THE_NOTCH = { x: 0.76, y: 0.38 };

async function imageBox(page: Page) {
  const box = await page.locator(".leaflet-image-layer").first().boundingBox();
  if (!box) throw new Error("the map image is not laid out — no bounding box");
  return box;
}

test.describe("polygon areas (SPEC-024)", () => {
  test("draws a concave area vertex by vertex, edits it in place, and containment follows its outline", async ({
    page,
  }) => {
    const title = `E2E SPEC-024 area ${Date.now()}`;

    await page.goto("/dashboard/dnd5e/geography");
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);
    const box = await imageBox(page);
    const at = (point: { x: number; y: number }) => ({
      x: box.x + box.width * point.x,
      y: box.y + box.height * point.y,
    });
    const map = await page.locator(".leaflet-container").boundingBox();
    if (!map) throw new Error("the map is not laid out — no bounding box");
    // `openContextMenu` takes map-relative pixels.
    const onMap = (point: { x: number; y: number }) => {
      const page = at(point);
      return { x: page.x - map.x, y: page.y - map.y };
    };

    await chooseFromContextMenu(
      page,
      onMap(IN_THE_ARM),
      messages.geography.drawArea.trigger
    );
    for (const vertex of L_SHAPE) {
      const { x, y } = at(vertex);
      await page.mouse.click(x, y);
    }
    await page.keyboard.press("Enter");

    // The drawn outline opens the create form for a navigable place.
    await page
      .getByLabel(messages.geography.poiPanel.fields.mapImage, { exact: true })
      .setInputFiles(PNG_FILE);
    await page
      .getByPlaceholder(messages.geography.poiPanel.placeholders.placeName)
      .fill(title);
    await page
      .getByRole("button", { name: messages.geography.poiPanel.save.save })
      .click();
    await page
      .getByRole("button", {
        name: messages.geography.poiPanel.close,
        exact: true,
      })
      .click();
    const area = page.getByRole("button", { name: title, exact: true });
    await expect(area).toBeVisible();
    await expect(
      page.locator(".leaflet-tooltip", { hasText: title })
    ).toBeVisible();

    // Inside the arm: the menu withholds "Aggiungi luogo" (SPEC-009 T4).
    let menu = await openContextMenu(page, onMap(IN_THE_ARM));
    await expect(
      menu.getByRole("button", {
        name: messages.geography.contextMenu.addPlace.trigger,
      })
    ).toHaveCount(0);
    await page.keyboard.press("Escape");

    // In the notch — inside the bounding box, outside the outline — it is
    // offered: containment follows the polygon, not the box around it.
    menu = await openContextMenu(page, onMap(IN_THE_NOTCH));
    await expect(
      menu.getByRole("button", {
        name: messages.geography.contextMenu.addPlace.trigger,
      })
    ).toBeVisible();
    await page.keyboard.press("Escape");

    const popover = page.getByRole("dialog", { name: title, exact: true });
    const openPopover = async () => {
      await expect(async () => {
        const arm = at(IN_THE_ARM);
        await page.mouse.click(arm.x, arm.y);
        await expect(popover).toBeVisible({ timeout: 1000 });
      }).toPass({ timeout: 10_000 });
    };
    const addPlaceOffered = async (point: { x: number; y: number }) => {
      const found = await openContextMenu(page, onMap(point));
      const count = await found
        .getByRole("button", {
          name: messages.geography.contextMenu.addPlace.trigger,
        })
        .count();
      await page.keyboard.press("Escape");
      return count > 0;
    };

    // T5: edit the outline in place. Removing the L's inner corner (vertex
    // 4 of 6) turns the notch into a slope, and a point that was in the
    // notch is now inside the area.
    const onTheSlope = { x: 0.72, y: 0.38 };
    expect(await addPlaceOffered(onTheSlope)).toBe(true);
    await openPopover();
    await popover
      .getByRole("button", { name: messages.geography.popover.editZone })
      .click();
    await page
      .getByRole("button", { name: messages.geography.zoneEdit.area.edit })
      .click();
    const bar = page.getByRole("region", { name: title, exact: true });
    await expect(bar).toBeVisible();
    // Every handle is a named, focusable control, and the bar names the
    // area: the keyboard can edit what the pointer can (§8).
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21a", "wcag21aa"])
      .include(".leaflet-container")
      .analyze();
    expect(
      results.violations.map((v) => `${v.id} (${v.nodes.length} nodes)`),
      "axe violations on the map while an outline is edited"
    ).toEqual([]);
    await page
      .getByRole("button", {
        name: messages.geography.outlineEdit.vertex
          .replace("{index}", "4")
          .replace("{total}", "6"),
      })
      .click({ button: "right" });
    await expect(
      page.getByRole("button", {
        name: messages.geography.outlineEdit.vertex
          .replace("{index}", "1")
          .replace("{total}", "5"),
      })
    ).toBeVisible();
    await bar
      .getByRole("button", { name: messages.geography.outlineEdit.save })
      .click();
    await expect(bar).toHaveCount(0);
    await expect.poll(() => addPlaceOffered(onTheSlope)).toBe(false);

    // Stored, not only drawn: a fresh load reads the same outline.
    await page.reload();
    await expect(page.locator(".leaflet-container")).toBeVisible();
    await page.waitForLoadState("networkidle");
    await page.waitForTimeout(300);
    expect(await addPlaceOffered(onTheSlope)).toBe(false);
    expect(await addPlaceOffered(IN_THE_NOTCH)).toBe(true);

    // Cleanup, through the area's own popover.
    await openPopover();
    await popover
      .getByRole("button", {
        name: messages.geography.popover.remove,
        exact: true,
      })
      .click();
    await page
      .getByRole("radio", {
        name: messages.geography.removePlace.outcomes.deleteLabel,
      })
      .click();
    await page
      .getByRole("button", { name: messages.geography.removePlace.confirm })
      .click();
    await expect(area).toHaveCount(0);
  });
});

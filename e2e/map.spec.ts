import { test, expect } from "@playwright/test";

/**
 * The Leaflet map. Per docs/TESTING.md §"Explicitly out of scope" this does not
 * test Leaflet's own rendering — it tests that our module mounts it, that the
 * map switcher swaps the artwork, and that the context menu a DM uses to drop a
 * marker opens where they click.
 *
 * NOTE: this map has no tile layer. Each world is a single hand-drawn image
 * served from /maps/*.jpg and placed with Leaflet's image overlay, so the DOM
 * carries one `.leaflet-image-layer` and no `.leaflet-tile` at all. Asserting
 * on tiles looks right and always fails.
 */
const imageLayer = ".leaflet-image-layer";

test.describe("world map", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dashboard/geography");
    await expect(
      page.getByRole("heading", { name: "Geografia" })
    ).toBeVisible();
  });

  test("the map mounts and renders its artwork", async ({ page }) => {
    await expect(page.locator(".leaflet-container")).toBeVisible();

    // A mounted-but-imageless map is the failure mode worth catching: it looks
    // like a grey box and throws nothing.
    const overlay = page.locator(imageLayer);
    await expect(overlay).toBeVisible();
    await expect(overlay).toHaveAttribute("src", /\/maps\/.+\.(jpg|png)$/);
  });

  test("switching world swaps the map image", async ({ page }) => {
    const overlay = page.locator(imageLayer);

    const before = await overlay.getAttribute("src");

    await page.getByRole("button", { name: "Regno di Kang" }).click();

    await expect
      .poll(() => overlay.getAttribute("src"), {
        message: "the image overlay should point at a different map",
      })
      .not.toBe(before);
  });

  test("right-clicking the map opens the context menu", async ({ page }) => {
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible();

    await map.click({ button: "right", position: { x: 300, y: 200 } });

    const menu = page.getByLabel("Map context menu");
    await expect(menu).toBeVisible();
    await expect(menu.getByText("Add Marker")).toBeVisible();
    await expect(menu.getByText("Copy Coordinates")).toBeVisible();
  });
});

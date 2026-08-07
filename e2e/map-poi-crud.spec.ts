import { test, expect } from "@playwright/test";

/**
 * TD-46 (first sub-slice, see docs/TECH_DEBT.md): the "My Places" POI panel's
 * own add/edit/delete flow, distinct from `map-poi-link.spec.ts` which covers
 * the linked-entity popup link and never exercises edit or delete.
 *
 * POIs are rows in Postgres (TD-14 / SPEC-002), not `localStorage` — this
 * writes and deletes a real row like the other CRUD specs.
 */
test.describe("POI panel CRUD", () => {
  test("a POI can be added, edited, and deleted from the list panel", async ({
    page,
  }) => {
    const title = `E2E POI CRUD ${Date.now()}`;
    const updatedTitle = `${title} updated`;

    await page.goto("/dashboard/geography");
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible();

    // Add
    await map.click({ button: "right", position: { x: 400, y: 250 } });
    await page.getByRole("button", { name: /Add Place/ }).click();
    await page.getByPlaceholder("Enter place name").fill(title);
    await page
      .locator("select")
      .filter({ has: page.locator("option", { hasText: "None" }) })
      .selectOption({ label: "None" });
    await page.getByRole("button", { name: "Save" }).click();

    const listItem = page.locator("button", { hasText: title }).first();
    await expect(listItem).toBeVisible();

    // Edit
    const row = page.locator("div", { has: listItem }).last();
    await row.hover();
    await row.getByTitle("Edit").click();
    const titleInput = page.getByPlaceholder("Enter place name");
    await titleInput.fill(updatedTitle);
    await page.getByRole("button", { name: "Update" }).click();

    const updatedItem = page
      .locator("button", { hasText: updatedTitle })
      .first();
    await expect(updatedItem).toBeVisible();
    await expect(
      page.locator("button", { hasText: title, hasNotText: "updated" })
    ).toHaveCount(0);

    // Delete
    const updatedRow = page.locator("div", { has: updatedItem }).last();
    await updatedRow.hover();
    await updatedRow.getByTitle("Delete").click();
    await expect(updatedItem).toHaveCount(0);
  });
});

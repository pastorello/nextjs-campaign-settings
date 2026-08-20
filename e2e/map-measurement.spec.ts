import { test, expect } from "@playwright/test";
import messages from "@/messages/it.json";

/**
 * SPEC-015 T7: measurement is click–track–click on the map's own grid
 * (`MapMeasureTool`), replacing the vendored panel flow this spec used to
 * drive — whose haversine arithmetic on pixel coordinates was TD-94.
 *
 * The world-setup root's map image is a deliberately minimal 8-byte PNG
 * (`world.setup.ts`) that no browser can decode, so the image never
 * reports a natural size and nothing can be measured against it — which
 * makes the *unavailable* edge case (§5's table) the honest end-to-end
 * path here: measurement must refuse with the one-line explanation, never
 * a guess. The full click–track–click interaction is covered by
 * `MapMeasureTool.test.tsx` against a mocked map; driving it end-to-end
 * needs a decodable fixture image (recorded in SPEC-015 §11).
 */
test.describe("map measurement", () => {
  test("without a usable grid, measuring refuses with an explanation (SPEC-015 §5, TD-94)", async ({
    page,
  }) => {
    await page.goto("/dashboard/geography");
    const map = page.locator(".leaflet-container");
    await expect(map).toBeVisible();

    await map.click({ button: "right", position: { x: 300, y: 200 } });
    await page
      .getByRole("button", {
        name: messages.geography.contextMenu.measure.trigger,
      })
      .click();

    await expect(
      page.getByText(messages.geography.measure.unavailable)
    ).toBeVisible();
  });
});

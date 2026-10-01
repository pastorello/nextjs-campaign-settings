import { test as setup, expect } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * Creates the tree's root place before any spec that expects an interactive
 * map at `/dashboard/dnd5e/geography`. SPEC-004 M4-M7 turned that page from an
 * always-on hardcoded four-map switcher into a view that requires a root
 * place to exist first — `db:seed` deliberately does not create one (that
 * would be seeding a demo world into every real installation too), so the
 * e2e suite has to.
 *
 * Idempotent: if a previous run already created the root, the name input
 * that would be filled here simply isn't there, and this is a no-op.
 */
setup("create the world", async ({ page }) => {
  await page.goto("/dashboard/dnd5e/world");

  const nameInput = page.getByPlaceholder(messages.world.form.namePlaceholder);
  if (!(await nameInput.isVisible().catch(() => false))) {
    return;
  }

  await nameInput.fill(`E2E World ${Date.now()}`);

  await page.locator('input[type="file"]').setInputFiles({
    name: "world.png",
    mimeType: "image/png",
    buffer: Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]),
  });

  await page.getByRole("button", { name: messages.world.form.submit }).click();

  await expect(nameInput).toBeHidden();
});

/**
 * Compiles the image routes before any spec reaches them. `test:e2e` runs
 * against `next dev`, which compiles a route on its first request, and a
 * finished compile is broadcast to every open page as a Fast Refresh. On a
 * cold CI runner that compile can end seconds after the request that began
 * it, in the middle of whatever the spec does next: `map-move-between-maps`
 * lost a region's save that way (its markers dropped to none, then came back
 * without the new one), and only ever in a run where a map image had been
 * uploaded or read for the first time a moment earlier. Asking for each
 * route once, here, moves those compiles before any page is open.
 *
 * The answers do not matter (a GET on the upload route is a 405, an unknown
 * image a 404); a 5xx would mean the route failed to compile, which every
 * spec using it would hit anyway, so it fails here, where it is clearer.
 */
setup("compile the image routes", async ({ request }) => {
  for (const path of [
    "/api/maps/upload",
    "/api/maps/warm-up/image",
    "/api/record-images",
    "/api/record-images/warm-up",
    "/api/record-images/by-id/0",
  ]) {
    const response = await request.get(path);
    expect(response.status(), path).toBeLessThan(500);
  }
});

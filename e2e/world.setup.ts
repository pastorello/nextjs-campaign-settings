import { test as setup, expect } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * Creates the tree's root place before any spec that expects an interactive
 * map at `/dashboard/geography`. SPEC-004 M4-M7 turned that page from an
 * always-on hardcoded four-map switcher into a view that requires a root
 * place to exist first — `db:seed` deliberately does not create one (that
 * would be seeding a demo world into every real installation too), so the
 * e2e suite has to.
 *
 * Idempotent: if a previous run already created the root, the name input
 * that would be filled here simply isn't there, and this is a no-op.
 */
setup("create the world", async ({ page }) => {
  await page.goto("/dashboard/world");

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

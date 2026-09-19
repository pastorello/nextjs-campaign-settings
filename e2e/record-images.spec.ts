import { test, expect, type Locator, type Page } from "@playwright/test";
import sharp from "sharp";

import messages from "@/messages/it.json";

/**
 * An NPC's portrait end to end (SPEC-020 T4): uploaded through the form's
 * image field, shown as a thumbnail in the admin list and on the public
 * card, then removed. Deliberately small — SPEC-020 T6 is the full journey,
 * map pin included.
 *
 * The PNG is generated here rather than committed: the server decodes every
 * upload, so a few magic bytes would be refused, and a real file in the repo
 * is one more thing to keep.
 */
const name = `E2E PNG ritratto ${Date.now()}`;
const IMAGE_LABEL = messages.common.fields.image.label;

const portrait = async () => ({
  name: "portrait.png",
  mimeType: "image/png",
  buffer: await sharp({
    create: {
      width: 64,
      height: 48,
      channels: 3,
      background: { r: 180, g: 40, b: 40 },
    },
  })
    .png()
    .toBuffer(),
});

/** See spells-crud.spec.ts: a new record is not on page 1 of a real library. */
const gotoAdminList = async (page: Page) => {
  await page.goto(
    `/dashboard/dnd5e/admin/npc?query=${encodeURIComponent(name)}`
  );
  // Row buttons open client-side dialogs; a click that lands before
  // hydration is swallowed.
  await page.waitForLoadState("networkidle");
};

const rowFor = (page: Page) => page.getByRole("row").filter({ hasText: name });

/** Loaded, not merely present: the authenticated route actually served it. */
const expectLoaded = async (img: Locator) => {
  await expect(img).toBeVisible();
  await expect
    .poll(() => img.evaluate((el: HTMLImageElement) => el.naturalWidth))
    .toBeGreaterThan(0);
};

test.describe("Record images", () => {
  test("an NPC's portrait shows in the list and on the card, and can be removed", async ({
    page,
  }) => {
    await page.goto("/dashboard/dnd5e/admin/npc");
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
    await page.waitForURL("**/dashboard/dnd5e/admin/npc");

    // The admin list's row thumbnail.
    await gotoAdminList(page);
    await expectLoaded(rowFor(page).getByRole("img", { name }));

    // The public card's thumbnail.
    await page.goto(`/dashboard/dnd5e/npc?query=${encodeURIComponent(name)}`);
    await expectLoaded(page.getByRole("img", { name }).first());

    // Removed through the edit dialog: the row falls back to its placeholder.
    await gotoAdminList(page);
    await rowFor(page)
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

    await gotoAdminList(page);
    await expect(rowFor(page).getByRole("img")).toHaveCount(0);
    await expect(
      rowFor(page).getByTestId("record-thumbnail-placeholder")
    ).toBeVisible();

    // Clean up the record.
    await rowFor(page)
      .getByRole("button", { name: messages.common.form.delete })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: messages.common.form.delete })
      .click();
    await expect(rowFor(page)).toHaveCount(0);
  });
});

import { test, expect, type Locator, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * TD-93's invariant, proven against a real Postgres rather than a mocked
 * `prisma`: something already placed somewhere has to be removed from there
 * before it can be placed anywhere else.
 *
 * A unit test can only assert that the mutation sends the right `where`;
 * what has to hold is that the *database* is the thing refusing the second
 * attachment — the pre-state travels inside `updateMany`'s filter, so no
 * interleaved write can slip between a check and an update. This is the same
 * reasoning TD-69's archive entry records for the `poi` unique constraint,
 * and the same reason that item chose an e2e spec over a mock.
 *
 * The NPC admin list is the cheapest surface that reaches the rule: the map's
 * place popover calls the identical `assignLocation` mutation (SPEC-016 T4),
 * but getting an entity attached there costs a map, a place and a popover
 * first. The zone chosen is whichever the world already has — `world.setup`
 * creates the root with a generated name, so the spec picks the first option
 * that is not the "none" entry rather than naming one.
 */
const locationModal = messages.common.locationModal;

const zoneSelectButton = (dialog: Locator) =>
  dialog.getByTestId("form-select").first().getByRole("button");

const save = (dialog: Locator) =>
  dialog.getByRole("button", { name: messages.common.form.save }).click();

test.describe("an entity's location is single-valued (TD-93)", () => {
  test("refuses attaching an NPC that already has one, and clearing is the way back", async ({
    page,
  }: {
    page: Page;
  }) => {
    const name = `E2E TD93 PNG ${Date.now()}`;

    await page.goto("/dashboard/admin/npc");
    await page
      .getByRole("link", { name: messages.npc.page.newItemButton })
      .click();
    // Wait for the create page before touching "Nome": the list page has a
    // sort button with the same accessible name (npc-crud.spec.ts waits on
    // the same heading for the same reason).
    await expect(
      page.getByRole("heading", { name: messages.npc.form.createTitle })
    ).toBeVisible();
    await page.getByLabel(messages.common.fields.name.label).fill(name);
    await page
      .getByRole("button", { name: messages.npc.form.createButton })
      .click();
    await page.waitForURL("**/dashboard/admin/npc");

    // See spells-crud.spec.ts: a new record is not on page 1 of a real
    // library, so the row is reached through the search query.
    await page.goto(`/dashboard/admin/npc?query=${encodeURIComponent(name)}`);
    const row = page.getByRole("row").filter({ hasText: name });
    await expect(row).toBeVisible();

    const openModal = async () => {
      await row
        .getByRole("button", { name: messages.common.table.assignLocation })
        .click();
      return page.getByRole("dialog");
    };

    // First attachment: the row is detached, so the guarded write matches it.
    let dialog = await openModal();
    await zoneSelectButton(dialog).click();
    await dialog
      .getByRole("option")
      .filter({ hasNotText: locationModal.zoneNoneOption })
      .first()
      .click();
    await save(dialog);
    await expect(dialog).toHaveCount(0);

    // Second attachment: the modal reopens on the location it already has,
    // and saving it unchanged is the second placement the DM asked to be
    // refused. Nothing is re-selected here deliberately — the payload the
    // form sends is legitimate on its face, and only the row's own current
    // state makes it a refusal.
    dialog = await openModal();
    await save(dialog);
    await expect(dialog.getByRole("alert")).toContainText(
      locationModal.alreadyPlaced
    );
    // Still mounted: a refusal keeps the modal open with the message in it,
    // it does not close as a successful save does. (`toHaveCount`, not
    // `toBeVisible`: Headless UI's outer dialog element measures as hidden
    // while its panel is on screen.)
    await expect(dialog).toHaveCount(1);

    // The removal the refusal points at, on this same surface — without it
    // the invariant would be a dead end here (the map's popover X is the
    // other way out, SPEC-016 T3).
    await zoneSelectButton(dialog).click();
    await dialog
      .getByRole("option", { name: locationModal.zoneNoneOption })
      .click();
    await save(dialog);
    await expect(dialog).toHaveCount(0);

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

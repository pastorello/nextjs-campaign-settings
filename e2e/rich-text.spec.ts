import { test, expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * SPEC-019 T7: the formatted-text editor end to end — toolbar formatting, the
 * record-link picker, and the sanitised, resolved result on display.
 *
 * Uses a faction, the shortest CRUD flow with a `RichText` description
 * (`pageMetaFields.description`, shared by every domain listed in SPEC-019
 * §5.1). The link target is an NPC this spec creates itself rather than a
 * seeded one — the project convention (see npc-list.spec.ts): the seed is the
 * DM's real, Italian campaign content and its names are not something a spec
 * should depend on.
 *
 * The editor is a Tiptap `contenteditable`, not an `<input>`, so selections
 * are made with the keyboard (Home/End, Shift+Arrow) rather than `.fill()` —
 * precise, and it doubles as a keyboard-only pass over the toolbar.
 */
const stamp = Date.now();
const npcName = `E2E PNG Link Target ${stamp}`;
const factionName = `E2E Fazione Formattata ${stamp}`;

const BOLD_WORD = "Powerful";
const FIRST_ITEM = "Recruits from the docks";
const LINKED_WORD = "archive";
const SECOND_ITEM = `Guards the sealed ${LINKED_WORD}`;

const gotoAdmin = async (page: Page, path: string, heading: string) => {
  await page.goto(path);
  // Row/toolbar buttons open client-side dialogs and editors; a click that
  // lands before hydration is swallowed (seen on CI, 2026-09-18 and
  // 2026-09-17 — see factions-crud.spec.ts and npc-list.spec.ts).
  await page.waitForLoadState("networkidle");
  await expect(page.getByRole("heading", { name: heading })).toBeVisible();
};

const rowFor = (page: Page, name: string) =>
  page.getByRole("row").filter({ hasText: name });

/**
 * Deletes the row if it exists — a no-op otherwise, so the `finally` below can
 * run it whether or not the test got as far as creating the row.
 */
const deleteRow = async (page: Page, listPath: string, name: string) => {
  await page.goto(`${listPath}?query=${encodeURIComponent(name)}`);
  await page.waitForLoadState("networkidle");
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

test("a formatted description keeps its bold text, its list and a working record link", async ({
  page,
}) => {
  // Cleanup runs in `finally`: the rows are real, and a failure part-way
  // through must not leave them behind for the specs that run after this one.
  try {
    // --- Fixture: the record the link will point at --------------------------
    // The admin NPC list renders `npc.page.adminTitle` ("PNG"), not the public
    // page's `title` ("Personaggi conosciuti") — see the admin page.tsx's
    // `<PageTitle>{t("adminTitle")}</PageTitle>`. Factions has no such split
    // (`page.title` covers both), which is why `gotoAdmin` below, for factions,
    // uses `factions.page.title` unchanged.
    await gotoAdmin(
      page,
      "/dashboard/dnd5e/admin/npc",
      messages.npc.page.adminTitle
    );
    await page
      .getByRole("link", { name: messages.npc.page.newItemButton })
      .click();
    await expect(
      page.getByRole("heading", { name: messages.npc.form.createTitle })
    ).toBeVisible();
    await page.getByLabel(messages.common.fields.name.label).fill(npcName);
    await page
      .getByRole("button", { name: messages.npc.form.createButton })
      .click();
    await page.waitForURL("**/dashboard/dnd5e/admin/npc");

    // --- Create the faction, formatting its description via the toolbar ------
    await gotoAdmin(
      page,
      "/dashboard/dnd5e/admin/factions",
      messages.factions.page.title
    );
    await page
      .getByRole("link", { name: messages.factions.page.newItemButton })
      .click();
    await expect(
      page.getByRole("heading", { name: messages.factions.form.createTitle })
    ).toBeVisible();

    await page.getByLabel(messages.common.fields.name.label).fill(factionName);

    const editor = page.getByRole("textbox", {
      name: messages.common.fields.description.label,
    });
    await editor.click();
    await page.keyboard.type(`${BOLD_WORD} and secretive.`);

    // Bold the first word: select it by keyboard, not by position, since the
    // toolbar's own click handler (`onMouseDown` preventDefault) is what keeps
    // this selection alive through the click — see RichTextInput.tsx.
    await page.keyboard.press("Home");
    for (let i = 0; i < BOLD_WORD.length; i += 1) {
      await page.keyboard.press("Shift+ArrowRight");
    }
    const boldButton = page.getByRole("button", {
      name: messages.common.richText.bold,
    });
    await boldButton.click();
    await expect(editor.locator("strong")).toHaveText(BOLD_WORD);

    // A sync barrier, not decoration: ProseMirror learns of a keyboard caret
    // move from the browser's asynchronous `selectionchange`, so an Enter sent
    // straight after End can reach it while its selection is still the bold
    // word — and replace that word with a paragraph break. That is what CI
    // saved on 2026-09-19 (`<p></p><ul>…`, no "Powerful"), and it reproduces
    // with bare Tiptap; a human's keystrokes are never that close together.
    // Bold reads as off only once the editor's own state has the caret in the
    // plain text at the end of the line.
    await page.keyboard.press("End");
    await expect(boldButton).toHaveAttribute("aria-pressed", "false");

    // A bulleted list with two items, the second holding the link target.
    await page.keyboard.press("Enter");
    await page
      .getByRole("button", { name: messages.common.richText.bulletList })
      .click();
    await page.keyboard.type(FIRST_ITEM);
    await page.keyboard.press("Enter");
    await page.keyboard.type(SECOND_ITEM);

    // Link the last word of the second item to the NPC created above.
    for (let i = 0; i < LINKED_WORD.length; i += 1) {
      await page.keyboard.press("Shift+ArrowLeft");
    }
    // The same barrier: the link button is enabled only once the editor's
    // state holds a non-empty selection.
    const linkButton = page.getByRole("button", {
      name: messages.common.richText.link,
    });
    await expect(linkButton).toHaveAttribute("aria-disabled", "false");
    await linkButton.click();

    const linkPicker = page.getByRole("dialog", {
      name: messages.common.richText.linkPicker.title,
    });
    // Assert on the search box, not the dialog: Headless UI's outer dialog
    // element (the one carrying `role="dialog"`) has only `fixed` children, so
    // it measures zero-height and Playwright reads it as hidden while the
    // panel is on screen (see entity-location-invariant.spec.ts). For the same
    // reason, closing is checked with `toHaveCount(0)` — `not.toBeVisible()`
    // would pass with the dialog still open.
    const pickerSearch = linkPicker.getByLabel(
      messages.common.richText.linkPicker.searchLabel
    );
    await expect(pickerSearch).toBeVisible();
    await pickerSearch.fill(npcName);
    await linkPicker.getByRole("button", { name: npcName }).click();
    await expect(linkPicker).toHaveCount(0);

    // What is about to be saved, checked in the editor itself, so a failure
    // here says "the editing went wrong" rather than surfacing only on display.
    await expect(editor.locator("strong")).toHaveText(BOLD_WORD);
    await expect(editor.locator("li")).toHaveText([FIRST_ITEM, SECOND_ITEM]);
    await expect(editor.locator("a")).toHaveText(LINKED_WORD);

    await page
      .getByRole("button", { name: messages.factions.form.createButton })
      .click();
    await page.waitForURL("**/dashboard/dnd5e/admin/factions");

    // --- Display: the public list page renders the formatted result ----------
    await page.goto(
      `/dashboard/dnd5e/factions?query=${encodeURIComponent(factionName)}`
    );
    await page.waitForLoadState("networkidle");

    await page.getByRole("button", { name: factionName }).click();

    await expect(page.locator("strong", { hasText: BOLD_WORD })).toBeVisible();
    await expect(page.getByText(FIRST_ITEM)).toBeVisible();
    await expect(page.getByText(SECOND_ITEM)).toBeVisible();

    const recordLink = page.getByRole("link", {
      name: LINKED_WORD,
      exact: true,
    });
    await expect(recordLink).toBeVisible();
    await recordLink.click();

    // A regex, not a glob: `?` is a single-character wildcard in Playwright's
    // glob syntax, so a literal query string needs `waitForURL`'s other form
    // (see filtering.spec.ts).
    await page.waitForURL(
      new RegExp(`/dnd5e/npc\\?query=${encodeURIComponent(npcName)}`)
    );
    await expect(page.getByText(npcName)).toBeVisible();
  } finally {
    // --- Cleanup -------------------------------------------------------------
    await deleteRow(page, "/dashboard/dnd5e/admin/factions", factionName);
    await deleteRow(page, "/dashboard/dnd5e/admin/npc", npcName);
  }
});

import { readFile } from "node:fs/promises";
import { test, expect, type Locator, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * SPEC-033 T1: one record's and one list's Markdown export, downloaded from
 * the admin list as the DM would. End to end on purpose: the route writes
 * its labels with `getTranslations({ locale })` outside any page, which is
 * exactly what the unit tests mock. The unauthenticated refusal is in
 * auth.spec.ts, which runs without a session (see validation.spec.ts on why
 * an "anonymous" request context here would not be anonymous).
 */
const ADMIN_NPC = "/dashboard/dnd5e/admin/npc";
const uniqueName = () => `E2E Esporta ${Date.now()}`;

/** See spells-crud.spec.ts: a new record is not on page 1 of a real library. */
const gotoNpc = async (page: Page, name: string) => {
  await page.goto(`${ADMIN_NPC}?query=${encodeURIComponent(name)}`);
  await page.waitForLoadState("networkidle");
};

const download = async (page: Page, link: Locator) => {
  const [file] = await Promise.all([
    page.waitForEvent("download"),
    link.click(),
  ]);
  return {
    fileName: file.suggestedFilename(),
    text: await readFile(await file.path(), "utf8"),
  };
};

test.describe("Markdown export (SPEC-033 T1)", () => {
  test("the DM downloads an NPC, then the list it is in", async ({ page }) => {
    const name = uniqueName();

    await page.goto(ADMIN_NPC);
    await page
      .getByRole("link", { name: messages.npc.page.newItemButton })
      .click();
    await expect(
      page.getByRole("heading", { name: messages.npc.form.createTitle })
    ).toBeVisible();
    await page.getByLabel(messages.common.fields.name.label).fill(name);
    await page
      .getByRole("textbox", { name: messages.common.fields.description.label })
      .click();
    await page.keyboard.type("Guards the north gate.");
    await page
      .getByRole("button", { name: messages.npc.form.createButton })
      .click();
    await page.waitForURL(`**${ADMIN_NPC}`);

    // --- One record ---------------------------------------------------------
    await gotoNpc(page, name);
    const record = await download(
      page,
      page.getByRole("link", {
        name: messages.common.table.exportItem.replace("{name}", name),
      })
    );

    expect(record.fileName).toBe(`${name.toLowerCase().replace(/ /g, "-")}.md`);
    expect(record.text.startsWith(`# ${name}\n`)).toBe(true);
    // Labels and option values in the DM's language, not message keys.
    expect(record.text).toContain(
      `**${messages.common.fields.description.label}**\n\nGuards the north gate.`
    );
    expect(record.text).toContain(
      `- **${messages.npc.fields.alignment.label}:** `
    );
    expect(record.text).not.toMatch(/\bnpc\.fields\./);

    // --- The list, under its filter ----------------------------------------
    const list = await download(
      page,
      page.getByRole("link", { name: messages.common.table.exportList })
    );

    expect(list.fileName).toBe("npc.md");
    // The search matches this NPC alone, so the list is this one record.
    expect(list.text).toBe(record.text);

    // --- Clean up ------------------------------------------------------------
    await page
      .getByRole("row")
      .filter({ hasText: name })
      .getByRole("button", { name: messages.common.form.delete })
      .click();
    await page
      .getByRole("dialog")
      .getByRole("button", { name: messages.common.form.delete })
      .click();
    await expect(page.getByRole("row").filter({ hasText: name })).toHaveCount(
      0
    );
  });
});

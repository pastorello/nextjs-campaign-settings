import { test, expect, type Page } from "@playwright/test";

import messages from "@/messages/it.json";

/**
 * The NPC admin list's Fazione header filter (TD-78). SPEC-006 T7 made
 * `npc.faction` table-backed, and `SortableHeader` — which only knew a static
 * `PageMeta.options` list — left the column sort-only. The unit suites cover
 * each half (`SortableHeader` reading the bundle, `EntityList` handing it
 * over); this covers the seam between them, a server component passing the
 * bundle to a client one, and proves the list actually narrows.
 *
 * Creates its own faction and two NPCs rather than trusting seeded data, and
 * scopes the list to them with `?query=` — see spells-crud.spec.ts for why a
 * new record is not on page 1 of a real library.
 */
const stamp = Date.now();
const factionName = `E2E Fazione ${stamp}`;
const npcPrefix = `E2E PNG ${stamp}`;
const member = `${npcPrefix} membro`;
const outsider = `${npcPrefix} esterno`;

const FACTION_LABEL = messages.npc.fields.faction.label;

const rowFor = (page: Page, name: string) =>
  page.getByRole("row").filter({ hasText: name });

const createFaction = async (page: Page, name: string) => {
  await page.goto("/dashboard/admin/factions");
  await page
    .getByRole("link", { name: messages.factions.page.newItemButton })
    .click();
  // Until the form is up, `getByLabel("Nome")` resolves to the list's own
  // "Ordina per nome" sort button instead.
  await expect(
    page.getByRole("heading", { name: messages.factions.form.createTitle })
  ).toBeVisible();
  await page.getByLabel(messages.common.fields.name.label).fill(name);
  await page
    .getByRole("button", { name: messages.factions.form.createButton })
    .click();
  await page.waitForURL("**/dashboard/admin/factions");
};

const createNpc = async (page: Page, name: string, faction?: string) => {
  await page.goto("/dashboard/admin/npc");
  await page
    .getByRole("link", { name: messages.npc.page.newItemButton })
    .click();
  await expect(
    page.getByRole("heading", { name: messages.npc.form.createTitle })
  ).toBeVisible();
  await page.getByLabel(messages.common.fields.name.label).fill(name);
  if (faction !== undefined) {
    await page
      .getByTestId("form-select")
      .filter({ has: page.getByText(FACTION_LABEL, { exact: true }) })
      .getByRole("button")
      .click();
    await page.getByRole("option", { name: faction, exact: true }).click();
  }
  await page
    .getByRole("button", { name: messages.npc.form.createButton })
    .click();
  await page.waitForURL("**/dashboard/admin/npc");
};

const deleteRow = async (page: Page, listUrl: string, name: string) => {
  await page.goto(`${listUrl}?query=${encodeURIComponent(name)}`);
  await rowFor(page, name)
    .getByRole("button", { name: messages.common.form.delete })
    .click();
  await page
    .getByRole("dialog")
    .getByRole("button", { name: messages.common.form.delete })
    .click();
  await expect(rowFor(page, name)).toHaveCount(0);
};

test.describe("NPC admin list", () => {
  test("the Fazione header filters the list to that faction's NPCs", async ({
    page,
  }) => {
    await createFaction(page, factionName);
    await createNpc(page, member, factionName);
    await createNpc(page, outsider);

    await page.goto(
      `/dashboard/admin/npc?query=${encodeURIComponent(npcPrefix)}`
    );
    // See filtering.spec.ts: the header is a client component, and a click
    // that lands before hydration is swallowed silently.
    await page.waitForLoadState("networkidle");
    await expect(rowFor(page, member)).toBeVisible();
    await expect(rowFor(page, outsider)).toBeVisible();

    await page
      .getByRole("columnheader")
      .getByRole("button", { name: FACTION_LABEL, exact: true })
      .click();
    await page.getByRole("option", { name: factionName, exact: true }).click();

    await page.waitForURL(/[?&]faction=\d+/);
    // The URL changes before the server component streams the narrowed rows,
    // so these are retrying assertions, not a one-off read.
    await expect(rowFor(page, outsider)).toHaveCount(0);
    await expect(rowFor(page, member)).toBeVisible();

    // `npc.faction`'s foreign key is `onDelete: Restrict`: the member goes
    // before its faction can.
    await deleteRow(page, "/dashboard/admin/npc", member);
    await deleteRow(page, "/dashboard/admin/npc", outsider);
    await deleteRow(page, "/dashboard/admin/factions", factionName);
  });
});

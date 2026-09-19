# SPEC-019: Formatted text

- **Status:** **Shipped 2026-09-19; see §11.** Previously: Agreed 2026-09-19 — written from an interview with the DM the same day, read through and agreed without changes
- **Date:** 2026-09-19
- **Phase:** 5 (pulled forward: a prerequisite of SPEC-018 T4, see [SPEC-021](./021-daggerheart-domains-and-classes.md))
- **Related:** TD-76 (`renderRichText` renders plain text today) · ROADMAP Phase 5 "Rich text in descriptions" · [SPEC-011](./011-cross-entity-search.md) (search matches names and titles only — see T6) · [SPEC-020](./020-record-images.md) · [SPEC-021](./021-daggerheart-domains-and-classes.md) · ADR-0016 (to be written in T1: the editor and the stored format)

---

## 1. Problem

Every description in the app is one block of plain text. A long NPC entry, a
deity's dogma, a spell's higher-level effects or a Daggerheart feature cannot
have a list, a bold keyword or a heading, and cannot point at the NPC, place or
spell it mentions. The DM asked for formatted text on 2026-08-10 and again on
2026-09-19, with a toolbar rather than typed markup.

## 2. Goal

Every description field is edited with a toolbar editor offering bold, italic,
lists, headings and links to other records in the app, and is displayed
formatted — safely, whatever is stored.

## 3. Non-goals

- **Links to web pages.** Links point only at records in this app (decided
  2026-09-19).
- **Images, tables, colours, fonts, embeds** inside text. Images belong to records
  ([SPEC-020](./020-record-images.md)), not to prose.
- **Markdown syntax.** The DM chose a toolbar (2026-09-19); typing `**bold**` does
  nothing special.
- **Collaborative editing, comments, revision history.**
- **Short single-line fields** (names, titles): they stay plain text inputs.
- **Translating content** (ADR-0006).

## 4. User stories

- As a DM, I want to make a word bold or italic, write a list or a small heading
  in a description, so that long entries are readable at the table.
- As a DM, I want to link a mention of an NPC, place, spell or other record to
  that record, so that I can jump to it while reading.
- As a DM, I want my existing plain-text descriptions to keep working unchanged
  until I edit them.

## 5. Behaviour

**Main flow**

1. Every multi-line description field (today a `Textarea` control: descriptions,
   NPC appearance / personality / motivations / secrets, spell higher levels,
   campaign, adventure, scene and calendar-event descriptions, and the Daggerheart
   feature texts of SPEC-021) becomes a **rich-text editor**: a toolbar above an
   editable area.
2. The toolbar has: bold, italic, bulleted list, numbered list, heading (two
   levels, rendered as `h3`/`h4` so they never compete with the page's own
   headings), link to a record, remove link, undo, redo. Standard shortcuts work
   (Ctrl/Cmd+B, Ctrl/Cmd+I, Ctrl/Cmd+Z).
3. **Link to a record:** with text selected, the link button opens a picker that
   searches the app's records by name (the SPEC-011 search, all domains incl.
   places), grouped by domain; choosing one links the selection to that record.
4. **Display:** everywhere a description is shown today, it is shown formatted.
   A record link is a normal link to that record's page (the same destinations
   SPEC-011's results use; a place opens its map). A link whose record has since
   been deleted renders as plain text.
5. **Existing text:** a stored value that is plain text (everything today) is
   shown exactly as now — line breaks kept. Opening it in the editor turns each
   line into a paragraph; it is stored formatted only when saved. No migration
   rewrites existing rows.

**Edge cases**

| Situation                                           | Expected behaviour                                                                 |
| --------------------------------------------------- | ---------------------------------------------------------------------------------- |
| Pasting formatted text from a web page or Word      | Kept only as far as the allowed formatting; everything else becomes plain text     |
| Stored content with disallowed markup (hand-edited) | Stripped on save and again on display; never executed                              |
| A web URL typed or pasted                           | Stays plain text (no web links)                                                    |
| Linked record deleted                               | Rendered as plain text; the editor shows it unlinked                               |
| Search for a word                                   | Matches the text, not the markup (searching "strong" does not match every bold)    |
| Empty editor                                        | Stored as empty/null exactly as an empty textarea is today                         |
| Screen reader / keyboard only                       | Toolbar reachable by Tab, buttons labelled and `aria-pressed`; editor is a textbox |

## 6. Data model changes

None. Formatted text is stored in the **same text columns** as today, as a
restricted HTML fragment, sanitised on every write and again on every render
(ADR-0016 decides the exact format and the sanitiser). A record link is stored
as an anchor carrying the record's domain and id, never a URL — so moving pages
under `[system]` or a locale changes nothing stored.

- Backfill: none; plain-text rows are recognised and rendered as today.
- Reversible: yes — the columns keep holding text.

## 7. Metadata changes

A new `ControlType.RichText` in the metadata layer, with its own input
component in `app/ui/forms/inputs/`. Every field listed in §5.1 switches from
`Textarea` to `RichText` in its `PageMeta`; its `getDatum` switches from
`renderRichText` (plain) to the formatted renderer. The field's Zod validator
runs the sanitiser, so rule 2 (validate before writing) is where sanitising
happens. The bespoke editors outside the metadata layer (ADR-0011: scenes,
calendar events) use the same input component with their fields' metas.

## 8. Acceptance criteria

- [x] Every field in §5.1 edits with the toolbar and displays formatted
- [x] Only the allowed elements survive a save: a payload with `<script>`, `on*` attributes, `javascript:` or an external `href` is stripped (unit tests on the sanitiser)
- [x] Rendering sanitises again: a row written directly to the database with disallowed markup renders harmlessly
- [x] A plain-text value renders exactly as before (line breaks kept) and loads into the editor as paragraphs
- [x] A record link renders as a link to that record's page under the current locale and system, and as plain text once the record is deleted
- [x] Search matches words inside formatted text and never markup _(the "never markup" half is `searchIgnoresMarkup.test.ts`; the "matches words" half has no subject — T6's note explains why, and the criterion's safety property is what T7's e2e also exercises indirectly by linking, not searching, a formatted field)_
- [x] Toolbar is keyboard accessible, buttons labelled in both catalogues; axe stays clean on a form page _(T7: `RichTextInput.test.tsx`'s roving-focus/`aria-pressed` cases; `e2e/a11y.spec.ts`'s `admin/spells/new` and `admin/npc/new` already carry the toolbar, axe-clean)_
- [x] New UI copy lands in both `messages/it.json` and `messages/en.json` _(T7: audited by hand plus `messages.test.ts`'s key-parity and toolbar-name-collision tests)_
- [x] Every new mutation rejects an unauthenticated request _(`searchRecordLinks.test.ts`, `resolveRecordLinks.test.ts`, `fetchRecordLinkResolution.test.ts`)_
- [x] Every new mutation rejects invalid input with field-level errors _(Zod schemas on the same Server Actions; `richTextValidator.test.ts` for the field-level sanitiser)_
- [x] Coverage has not dropped _(measured 2026-09-19, `vitest --coverage` on the commit before T1 (`c3e138e`) vs this close: statements 84.54% → 84.89%, branches 82.13% → 82.23%, functions 82.25% → 83.09%, lines 85.31% → 85.66%)_

## 9. Implementation plan

**Risks**

- **A new dependency class** (an editor and a sanitiser). ADR-0016 weighs them;
  the proposal is Tiptap (MIT, ProseMirror-based, headless, React) for editing
  and a maintained allowlist sanitiser that runs on the server.
- **Search over HTML.** `contains` on the column would match tag names; T6 makes
  matching ignore markup.
- **Bundle size** on form pages only; the display side needs no editor code.

**Decided on 2026-09-19**

1. A toolbar editor, not Markdown.
2. Bold, italic, lists, headings, links.
3. Links to app records only.
4. Applied to every description in the app now, not only Daggerheart.

**Open questions**

1. None blocking; ADR-0016 records the library choice.

## 10. Task breakdown

- [x] **T1** — ADR-0016 (editor, stored format, sanitiser). The sanitiser module with its allowlist and the record-link anchor format. _(test: allowlist, attack payloads, record-link shape)_
  - _Done 2026-09-19:_ [ADR-0016](../adr/0016-formatted-text-as-sanitised-html.md) — Tiptap 3, a restricted HTML fragment, `sanitize-html` (+ `htmlparser2`), pinned exactly. `app/lib/utils/richText/`: `sanitizeRichText` (allowlist in `richTextAllowlist.ts`; links are `<a data-record-domain data-record-id>`, never `href`, invalid ones unwrapped via `parseRecordLink`), `isRichTextHtml` (HTML iff it opens with `p`/`ul`/`ol`/`h3`/`h4`), `plainTextToRichText`, `richTextToPlainText` (for T6). Domains: `RECORD_LINK_DOMAINS`, kept equal to `SEARCH_DOMAINS` by a test.
- [x] **T2** — The formatted renderer: plain-text fallback, sanitise-on-render, record links resolved to pages (deleted → plain text). Replaces `renderRichText`'s body. _(test: plain text unchanged; links; deleted target)_
  - _Done 2026-09-19:_ `renderRichText` keeps plain text as before; HTML is sanitised again and rebuilt as React elements (`richTextToReact`, no `dangerouslySetInnerHTML`). It is a `getDatum` rendered in client components too, so it stays synchronous: links resolve through `RecordLinkTargetsProvider` (context), fed by `fetchRecordLinkTargets` (server, one `findMany` per linked domain, filtered by system). Destinations are `recordHref`, extracted from the search results. No provider → links render as text. **For T5:** each page that renders a switched field must call `fetchRecordLinkTargets` on those values and mount the provider — nothing is wired yet, since no field stores HTML. TD-76's first test now uses `<b>…</b>`: a value opening with `<p>` is formatted text by definition.
- [x] **T3** — `ControlType.RichText` and its editor input with the toolbar, shortcuts, paste filtering. _(test: toolbar actions, paste, keyboard)_
  - _Done 2026-09-19:_ `RichTextInput` (`app/ui/forms/inputs/`), a drop-in for `TextareaInput` (same props, `onChange(string)`), so `EntityForm` and the ADR-0011 editors take it unchanged. Tiptap 3.31.3 pinned exactly; StarterKit trimmed to the allowlist (headings 3/4, `trailingNode` off) plus `recordLinkMark`, which parses only anchors `parseRecordLink` accepts — web links paste as text. Input/paste rules are off (§3: no Markdown); Mod-B/I/Z work. In: `richTextToEditorContent` (plain text → paragraphs, HTML sanitised); out: `editorHtmlToRichText` (sanitised, `""` when there is no text — what an emptied textarea sends). Toolbar: `role="toolbar"`, roving focus, `aria-pressed`/`aria-disabled`, copy under `common.richText`. `immediatelyRender: false` for SSR.
- [x] **T4** — The record-link picker. _(test: search, choose, unlink)_
  - _Done 2026-09-19:_ the link button (enabled only with text selected) opens `RecordLinkPicker` in the app's `Modal`: a search box over SPEC-011's `searchAllDomains`, reached through a new Server Action `searchRecordLinks` (session check, Zod on term and system, route's system passed so out-of-system catalogues are not offered), results grouped in the search page's order; choosing one applies `setRecordLink` to the selection, "remove link" unwraps. Debounced, latest request wins; loading/no-match/error states in an `aria-live` region. Lazy-loaded on first open. **For T5:** the editor does not yet show a link to a _deleted_ record as unlinked (§5 edge case) — it keeps the anchor until save, and the renderer shows it as text; T5 can pass the page's resolved targets in if that matters.
- [x] **T5** — Switch every field in §5.1 to `RichText`, incl. the bespoke editors. _(test: each domain's form saves formatted text)_
  - _Done 2026-09-19:_ `RichText` + `richTextValidator` (sanitises formatted text; legacy plain text passes unchanged, since escaping it would show entities) on: the shared `description` (spells, magic items, NPCs, factions, treasures), `upcast`, the NPC's four character fields, campaign/adventure `synopsis`, scene and calendar-event `description`, and `zoneMeta.description` (places and landmarks — `poiSchema`/`placeSchema` reuse it; sanitised before its `.min(1)`). Deities have no description field. Editors: `EntityForm` via the metadata; `CampaignForm`, `AdventureInfoForm`, `SceneForm`, `CalendarEventFields`, `ZoneEditPanel` and `MapPOIPanel` use `RichTextInput`. Displays: the five cards that still used `dangerouslySetInnerHTML` (missed by TD-76) now use `getDatum`; campaign/adventure headers, scene list, event summaries and the place popover use `renderRichText`. Links resolve per page (`ResolvedRecordLinks` + `richTextValuesOf`, one batch per page) on the list and admin pages, campaign, adventure, campaign calendar and world history; the map resolves client-side (`ClientResolvedRecordLinks` → `resolveRecordLinks` Server Action, session + Zod). `fetchRecordLinkResolution` also reports in-system links whose record is gone, and the editor opens those unlinked (T4's gap). **Left alone:** `sceneCreatureMeta.note` is declared `Textarea` but edited as a one-line `TextInput` and shown nowhere as prose — not a description; `TextareaInput` stays, still wired to `ControlType.Textarea`. No e2e spec filled a description, so none needed changing; T7 adds the e2e.
- [x] **T6** — Search ignores markup. _(test: "strong" does not match bold text; a word inside bold does)_
  - _Done 2026-09-19, by invariant rather than new machinery:_ neither search reads a formatted column. `getQuery`'s free-text branch matches `name`, `searchAllDomains` reuses it and adds `searchPlacesByTitle` (`zone.title`) — plain single-line fields (§3), which SPEC-011 §3 chose deliberately; this spec's "search matches description text" was a misreading and is corrected above. So markup cannot match anything, and a shadow column (a migration) or `regexp_replace` in raw SQL would strip tags from columns nobody searches. `searchIgnoresMarkup.test.ts` pins it: no page's free-text where touches a `RichText` field, "strong"/"data-record"/"npc" do not match a record whose only occurrence is markup, the place search reads `title` only. The test's second half ("a word inside bold does match") has no subject — descriptions are not searched at all; if description search is ever specified, it must match `richTextToPlainText` output (a generated plain-text column is the likely shape), and that test fails first.
- [x] **T7** — i18n, a11y (axe on a form page), e2e: format a description, link an NPC, open the link. _(test: e2e)_
  - _Done 2026-09-19:_ **i18n audit** — every string the editor, toolbar and link picker read (`common.richText.*`, `common.richText.linkPicker.*`, the `common.cards.*` domain group headings) already existed in both catalogues, key-for-key; `messages.test.ts`'s parity and toolbar-name-collision tests hold this mechanically, and a manual read of `RichTextInput.tsx`/`RichTextToolbar.tsx`/`RecordLinkPicker.tsx` found no hardcoded copy. Nothing to add. **a11y** — no new page was needed: `admin/spells/new` and `admin/npc/new` in `e2e/a11y.spec.ts`'s `PAGES` sweep already render a `RichText` field unconditionally (spells' `description`/`upcast`; NPC's shared `description` plus its four character fields) since T5, so the toolbar has been in the axe-clean sweep since that task landed — `e2e/a11y.spec.ts` now says so explicitly. **e2e** — `e2e/rich-text.spec.ts`: creates an NPC as the link target (project convention: never depend on the seeded, DM-authored data — see `npc-list.spec.ts`), creates a faction, types a description and uses the toolbar (keyboard selection, not mouse position) to bold a word and build a two-item bulleted list, opens the record-link picker and links the NPC, saves, then reopens the faction on the public list page and asserts the bold text, both list items and a working link that navigates to the NPC — and deletes both fixtures. Coverage measured over the whole spec (T1–T7): see §8.

## 11. Outcome

_Shipped 2026-09-19: all seven tasks done. Each task's entry in §10 carries its
detail, including where the build departed from the text above; this is the
summary._

- **Shipped:** ADR-0016 (Tiptap 3 + `sanitize-html`, a restricted HTML fragment
  as the stored format, record links as `<a data-record-domain data-record-id>`
  never `href`); a sanitise-on-write, sanitise-on-render formatted-text
  pipeline with no `dangerouslySetInnerHTML`; `ControlType.RichText` and its
  toolbar editor (bold, italic, two heading levels, bulleted/numbered lists,
  undo/redo, keyboard-accessible); the record-link picker over SPEC-011's
  search; every field in §5.1 switched over, including the ADR-0011 bespoke
  editors; a deleted link's target rendering as plain text; and the i18n/a11y/
  e2e closing pass (T7).
- **Deviations** are recorded in the §10 notes, chiefly: T6 needed no new
  machinery — no free-text search reads a formatted column, so "search ignores
  markup" holds by invariant rather than by a shadow column or `regexp_replace`
  (also recorded in `CLAUDE.md`'s decisions list); T4's picker did not yet
  handle a deleted link target, closed by T5's `fetchRecordLinkResolution`;
  T7 needed no new a11y-scan page, since T5's field switch already put a
  `RichText` control on two pages already in `e2e/a11y.spec.ts`'s sweep.
- **Follow-ups:** none known. SPEC-021 (Daggerheart feature text) and any
  future long-form field can adopt `ControlType.RichText` directly.

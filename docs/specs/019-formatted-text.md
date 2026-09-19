# SPEC-019: Formatted text

- **Status:** Agreed 2026-09-19 — written from an interview with the DM the same day, read through and agreed without changes
- **Date:** 2026-09-19
- **Phase:** 5 (pulled forward: a prerequisite of SPEC-018 T4, see [SPEC-021](./021-daggerheart-domains-and-classes.md))
- **Related:** TD-76 (`renderRichText` renders plain text today) · ROADMAP Phase 5 "Rich text in descriptions" · [SPEC-011](./011-cross-entity-search.md) (search matches description text) · [SPEC-020](./020-record-images.md) · [SPEC-021](./021-daggerheart-domains-and-classes.md) · ADR-0016 (to be written in T1: the editor and the stored format)

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

- [ ] Every field in §5.1 edits with the toolbar and displays formatted
- [ ] Only the allowed elements survive a save: a payload with `<script>`, `on*` attributes, `javascript:` or an external `href` is stripped (unit tests on the sanitiser)
- [ ] Rendering sanitises again: a row written directly to the database with disallowed markup renders harmlessly
- [ ] A plain-text value renders exactly as before (line breaks kept) and loads into the editor as paragraphs
- [ ] A record link renders as a link to that record's page under the current locale and system, and as plain text once the record is deleted
- [ ] Search matches words inside formatted text and never markup
- [ ] Toolbar is keyboard accessible, buttons labelled in both catalogues; axe stays clean on a form page
- [ ] New UI copy lands in both `messages/it.json` and `messages/en.json`
- [ ] Every new mutation rejects an unauthenticated request
- [ ] Every new mutation rejects invalid input with field-level errors
- [ ] Coverage has not dropped

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
- [ ] **T2** — The formatted renderer: plain-text fallback, sanitise-on-render, record links resolved to pages (deleted → plain text). Replaces `renderRichText`'s body. _(test: plain text unchanged; links; deleted target)_
- [ ] **T3** — `ControlType.RichText` and its editor input with the toolbar, shortcuts, paste filtering. _(test: toolbar actions, paste, keyboard)_
- [ ] **T4** — The record-link picker. _(test: search, choose, unlink)_
- [ ] **T5** — Switch every field in §5.1 to `RichText`, incl. the bespoke editors. _(test: each domain's form saves formatted text)_
- [ ] **T6** — Search ignores markup. _(test: "strong" does not match bold text; a word inside bold does)_
- [ ] **T7** — i18n, a11y (axe on a form page), e2e: format a description, link an NPC, open the link. _(test: e2e)_

## 11. Outcome

_Fill in at close._

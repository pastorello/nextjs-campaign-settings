# SPEC-033: Export — a domain, a record or the whole setting as Markdown

- **Status:** Draft — written 2026-10-15 from the ROADMAP's Phase 5 entry ("PDF or Markdown of a domain, or of the whole setting"). The product questions in §9 are the DM's; nothing is implemented until they are answered and this is agreed.
- **Date:** 2026-10-15
- **Phase:** 5
- **Related:** [ADR-0003](../adr/0003-metadata-driven-domain-configuration.md) (the metadata layer this export is driven by) · [ADR-0016](../adr/0016-formatted-text-as-sanitised-html.md) (descriptions are stored as sanitised HTML) · [SPEC-022](./022-accounts-roles-and-party-visibility.md) (`dmOnly` fields and the visibility scope) · [SPEC-018](./018-game-systems.md) §5 and [`licensing.md`](../domain/licensing.md) (what exporting content for others requires of each system) · [SPEC-020](./020-record-images.md) (images)

---

## 1. Problem

**The setting can only be read inside the app.** A DM who wants a printed handout for a table, a backup they can read without a database, a page to paste into a wiki, or a copy to hand to a co-DM has no way to take the setting out. Everything the DM wrote lives in Postgres and is visible only through the dashboard, one list page at a time.

## 2. Goal

A DM can download one record, one domain's list, or the whole setting as readable Markdown files, with the same fields and the same wording the app shows.

## 3. Non-goals

- **Import.** A separate roadmap item; the export format is not designed to round-trip.
- **A re-importable backup.** Database dumps are the backup; this is for reading and sharing.
- **Publication.** Sharing homebrew with strangers carries each system's licence obligations (SPEC-018 §5). Producing a file is not publishing it, but this spec does not make the licence statement the DM's problem to remember (see §9, question 4).
- **Campaign material** (campaigns, adventures, scenes, loot). It is the DM's private working material and stays out of search; whether it belongs in an export is question 3.
- **Per-field layout, themes or branding.** One plain, predictable layout.

## 4. User stories

- As a DM, I want to download a single NPC or deity as a page so that I can print it for the table.
- As a DM, I want to download a whole domain (all spells, all places) so that I can read or search it outside the app.
- As a DM, I want one archive of the whole setting so that I keep a readable copy that does not depend on the database.

## 5. Behaviour

**Main flow**

1. Every list page and every record card has an "Export" action. On a list it exports the records the list currently shows (filters applied); on a card, that record.
2. A "whole setting" action on the dashboard returns one archive: a folder per domain, one `.md` file per record, plus an index.
3. The Markdown of a record is produced from its `PageMeta`: the title, then each field in `pagesConfig` order, as a labelled line or section. Labels come from the message catalogues in the DM's locale; option-backed values resolve to their labels (the same `resolveFieldValue` the cards use).
4. A formatted description is converted from its stored sanitised HTML to Markdown: paragraphs, lists, headings, emphasis, and record links as plain text with the record's name.
5. The export is a route handler that checks the session (and, for a player, the visibility scope) before reading anything.

**Edge cases**

| Situation                                 | Expected behaviour                                                                                      |
| ----------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| Empty domain                              | The file states there are no records; the archive still has the folder                                  |
| A field with no value                     | Omitted, not printed as "—"                                                                             |
| `dmOnly` field (SPEC-022)                 | Included for the DM; never included for a player, who may export only what the visibility scope returns |
| A record linked to another                | The name, not an id; a link target the reader cannot see is printed as plain text without a name        |
| Record with an image                      | Question 5: the image is left out of the Markdown, or the archive carries the file beside it            |
| A very large domain (hundreds of records) | Streamed or built in memory within the request's limits; the archive is not cached                      |
| A name that is not a valid filename       | Slugified; a collision gets the record id appended                                                      |
| Content with `origin: srdReference`       | Question 4: marked in the file, so the SRD attribution can follow the export                            |

## 6. Data model changes

None.

## 7. Metadata changes

Probably none: the export reads `pageMetaFields` and `pagesConfig`. The one candidate is a per-field opt-out (`exportable?: false`) for a field whose value is meaningless outside the app; add it only if a real field needs it, and then declared on the `PageMeta` like `dmOnly`.

## 8. Acceptance criteria

- [ ] A record's Markdown contains every non-empty, non-`dmOnly` field of its page, in `pagesConfig` order, labelled in the requested locale
- [ ] The same export for a player contains no `dmOnly` field and no record outside their visibility scope
- [ ] A formatted description exports to Markdown with its structure intact; a legacy plain-text description is unchanged
- [ ] A list export honours the list's filters; the whole-setting archive honours none
- [ ] The export of a domain adding a new field in the metadata includes it with no change to the export code (test over `pageMetaFields`)
- [ ] The route rejects an unauthenticated request
- [ ] Coverage has not dropped

## 9. Implementation plan

_Written after the questions below are answered._

**Open questions for the DM**

1. **Format.** Markdown only, or PDF as well? Markdown is cheap and exact; PDF can be had without a new dependency by a print-styled page the DM prints from the browser, or with a server-side renderer (a heavy dependency). Recommendation: Markdown first, "print" later if wanted.
2. **Scope of the first slice.** One record and one domain's list, or also the whole-setting archive? Recommendation: record and domain first; the archive is the same code in a loop and ships as a second task.
3. **Campaign material.** Are campaigns, adventures, scenes and loot part of "the whole setting", or private working notes left out? (Recommendation: left out, as they are from search.)
4. **Licence statement.** When the export holds SRD-derived material, should the file carry the required attribution automatically (SPEC-018 §5; `NOTICE.md`)? Recommendation: yes, one footer per file or archive.
5. **Images.** Leave images out of the Markdown, or ship them beside the files in the archive?
6. **Who exports.** DM only, or a player too, restricted to what they can see?

**Files touched, in order** — to be filled once the questions are answered; the expected shape is a pure `renderRecordMarkdown(meta, record, locale)` under `app/lib/utils/export/`, one route handler per scope under `app/api/export/`, and the buttons in `app/ui/`.

**Risks**

- **A second place that knows the fields.** An export that lists fields by hand is exactly the drift the metadata layer exists to prevent; it must read the metadata.
- **HTML → Markdown fidelity.** The stored format is a small allow-list (ADR-0016), so a converter over that allow-list is bounded; anything outside it is stripped, as the renderer already does.

## 10. Task breakdown

_Not yet — written when this is agreed._

## 11. Outcome

_Fill in at close._

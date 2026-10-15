# SPEC-033: Export and import the setting — a zip of Markdown, structured data and images

- **Status:** Draft — written 2026-10-15 from the ROADMAP's Phase 5 entries "Export" and "Import". The DM answered the first round of product questions the same day (§9, _Answered_); two remain open (§9, _Open_). Nothing is implemented until they are answered and this is agreed.
- **Date:** 2026-10-15
- **Phase:** 5
- **Related:** [ADR-0003](../adr/0003-metadata-driven-domain-configuration.md) (the metadata layer both directions are driven by) · [ADR-0008](../adr/0008-map-image-storage.md) and [ADR-0017](../adr/0017-record-images.md) (where images live and how they are validated) · [ADR-0016](../adr/0016-formatted-text-as-sanitised-html.md) (descriptions, and the record links inside them) · [SPEC-022](./022-accounts-roles-and-party-visibility.md) (`dmOnly`, reveals) · [SPEC-018](./018-game-systems.md) §5 and [`licensing.md`](../domain/licensing.md) (what carrying content out of the app requires) · `app/seed/importLibrary.ts` (the existing `pnpm db:import`, which this supersedes for new exports)

---

## 1. Problem

**The setting can neither leave the app nor come back into it.** A DM who wants a printed handout, a readable copy that does not depend on Postgres, a backup of the world with its maps, or to move the setting to another install has no way to do it. Everything — places and their map images, NPCs, deities, factions, the catalogues — lives in one database and one upload directory. The only import is a developer script that reads an old spell-library file and matches on name.

## 2. Goal

A DM downloads the whole setting as one zip — readable Markdown, structured data and every map and record image — and can import that zip into an app instance to recreate the setting.

## 3. Non-goals

- **Campaign material** (campaigns, adventures, scenes, creatures, loot, campaign events and "today"). It is the DM's private working material (stays out of search), and **the DM put it outside the export, 2026-10-15**.
- **Accounts, roles, members and reveals.** People and who sees what belong to an install, not to the setting. An import creates no user and reveals nothing to anyone.
- **Formats other than this app's own.** Importing from D&D Beyond, 5e.tools or CSV is a different problem with a different parser; the ROADMAP keeps it as its own entry.
- **Overwriting.** An import only adds (§5); it never updates or deletes a record that is already there.
- **PDF.** The DM chose Markdown only; printing is the browser's job.
- **Publication.** A file leaving the app is not publishing, but the attribution it needs to travel with it (§5, step 6).

## 4. User stories

- As a DM, I want to download the whole setting as one file so that I keep a readable copy with its maps that does not depend on the database.
- As a DM, I want to download a single record or one domain's list as Markdown so that I can print it for the table.
- As a DM, I want to import such a file into a fresh install so that I recreate the setting there, with its places in the same tree and its maps in place.
- As a DM, I want an import to tell me what it would do before it does it, and to change nothing if anything in it is invalid.

## 5. Behaviour

### Export

1. A record card and a list page have an "Export" action (Markdown for one record; the list's current filter for a list). The dashboard has "Export setting", which returns the zip. All are **DM only**.
2. The zip has this shape:

   ```
   manifest.json            format version, app version, export date, the systems present, counts per domain
   data/<domain>.json       every record of the domain, as structured rows keyed by this export's own ids
   markdown/<domain>/<slug>.md   one readable file per record; plus markdown/index.md
   images/maps/<key>        the map image of each place that has one
   images/records/<key>     each record image (display version)
   NOTICE.md                attribution, when the setting carries SRD-derived content
   ```

3. **One field list.** The Markdown and the JSON are both produced from `pageMetaFields` and `pagesConfig`: the title, then each field in page order, labelled from the catalogues in the DM's locale; option-backed values resolve to their labels. A field added to the metadata appears in both with no change to the export code.
4. A formatted description is converted from its stored sanitised HTML to Markdown (paragraphs, lists, headings, emphasis); a record link becomes the record's name. In the JSON the HTML is kept as stored, with its `data-record-domain` / `data-record-id` links, because the import needs them (§5, Import step 5).
5. Included: places (zones and landmarks, with their tree and footprints), NPCs, deities, factions, the 5e catalogues (spells, magic items, treasures) and every Daggerheart catalogue. Not included: §3.
6. When any record has `origin: srdReference` or comes from a 5e SRD catalogue, `NOTICE.md` carries the statement `NOTICE.md` at the repository root holds (SPEC-018 §5), and the manifest says why.
7. Built server-side by a route handler that checks the DM's session first.

### Import

1. The DM uploads the zip on a dashboard page. The server **reads it without writing anything** and returns a summary: counts per domain, records whose name already exists, and every problem found.
2. The DM confirms; only then is anything written. The write is **one transaction**: any failure leaves the database exactly as it was.
3. Every record passes through the same declared Zod validators the forms use (`buildCreateSchema`); no row reaches Prisma unvalidated. An unknown format version, a missing manifest or a record that fails validation refuses the import and names the entry.
4. Records are **always created**, never matched and never overwritten. The ids in the file are this export's own: new rows get new ids, and every relation (place parent, landmark → place, NPC/deity → place or landmark, NPC → faction, Daggerheart links) is remapped through a table built in dependency order — places by depth, then landmarks, factions, NPCs, deities, catalogues.
5. **Record links inside descriptions are rewritten** to the new ids. A link whose target is not in the file is turned into plain text, not left pointing at someone else's row.
6. Images are stored through the same pipeline as an upload (`processRecordImage`, the map image upload rules): re-encoded, size-checked and given new keys. The zip's own bytes are never served.

**Edge cases**

| Situation                                          | Expected behaviour                                                                         |
| -------------------------------------------------- | ------------------------------------------------------------------------------------------ |
| Empty domain on export                             | The file says there are no records; the archive keeps the folder                           |
| A record with no value for a field                 | Omitted from the Markdown; `null` in the JSON                                              |
| `dmOnly` field                                     | Exported (the DM alone exports); imported into the same field                              |
| Import into a database that already has the world  | Succeeds, creates a second copy; the summary warned of the name collisions first (§9, Q7)  |
| A zip with a path like `../x` or an absolute path  | Refused whole (zip-slip); entries are read by exact expected name, never extracted to disk |
| A zip that decompresses to far more than it claims | Refused: entry count, per-entry size and total uncompressed size are capped before reading |
| An image that is not an image, or too large        | The record is imported without its image and the summary lists it — or refuses (§9, Q8)    |
| Rich-text link to a record not in the file         | Plain text                                                                                 |
| A file exported by a newer app version             | Refused with the version it needs                                                          |
| Two records of one domain with the same name       | Both are imported; the slug of the second gets its id appended in the Markdown             |

## 6. Data model changes

None expected. The format version lives in `manifest.json`, not in the database. If a record needs remembering where it came from (for a later merge), that is a new spec, not this one.

## 7. Metadata changes

Probably none. The one candidate is a per-field `exportable?: false` for a field whose value is meaningless outside the install, declared on `PageMeta` like `dmOnly`; add it only when a real field needs it.

## 8. Acceptance criteria

- [ ] Exporting then importing into an empty database, then exporting again, produces the same `data/` files up to ids (the round-trip test, in E2E)
- [ ] The Markdown and the JSON of a record contain every non-empty field of its page in `pagesConfig` order; adding a field to a meta adds it to both (test over `pageMetaFields`)
- [ ] A place's tree, its landmarks and every NPC/deity/faction relation survive the round trip; a rich-text record link points at the imported record
- [ ] Every place map image and record image is in the zip and comes back attached to its record after import
- [ ] No campaign, adventure, scene, user, member or reveal is in the zip, and an import creates none
- [ ] An import that contains one invalid record changes nothing (all-or-nothing)
- [ ] The dry run writes nothing, to the database or to the upload directory
- [ ] A hostile zip (path traversal, bomb, wrong content types, oversized image) is refused; each has a test
- [ ] Both directions reject an unauthenticated request and a `player`
- [ ] Coverage has not dropped

## 9. Implementation plan

**Answered (the DM, 2026-10-15)**

1. **Format:** Markdown only, no PDF — and the DM needs an export **and an import** of the setting, which is why the zip also carries structured data (Markdown alone cannot round-trip).
2. **First slice:** record and domain exports first; the whole-setting archive follows (T-order below).
3. **Campaign material:** outside the export.
4. **Licence statement:** carried automatically.
5. **Images:** map images (and record images) are downloaded, so the export is a zip with images and several files.
6. **Who:** the DM only.
7. **Import and export in one spec** (the DM, over splitting them), and "campagna" means the **setting**, not the game campaigns.

**Open**

8. **What an import does when the world is already there.** Recommendation: it adds (a second copy), after a dry-run summary that lists the name collisions; the alternative, matching by name and updating, is what `importLibrary.ts` does and is destructive. Which?
9. **World history.** The calendar's date systems and world-history events (the ones with no campaign, linked to places, NPCs, deities, factions) are part of the world rather than of a campaign. In or out of the first version? Recommendation: out, as a follow-up once the rest round-trips — their many-to-many links double the remapping.
10. **A bad image.** Refuse the whole import, or import the record without its image and say so? Recommendation: import without, and list it.

**Files touched, in order** (provisional)

| #   | File                                                              | Change                                                                                   |
| --- | ----------------------------------------------------------------- | ---------------------------------------------------------------------------------------- |
| 1   | `app/lib/utils/export/renderRecordMarkdown.ts`, `toRecordJson.ts` | Pure: meta + record + locale → Markdown / structured row                                 |
| 2   | `app/lib/utils/export/htmlToMarkdown.ts`                          | Over the ADR-0016 allow-list only                                                        |
| 3   | `app/api/export/**/route.ts`, `app/ui/export/**`                  | DM-only handlers; buttons on cards and lists                                             |
| 4   | `app/lib/export/buildSettingArchive.ts`, zip writer               | The archive; needs a zip library — **an ADR first** (candidates: `fflate`, `archiver`)   |
| 5   | `app/lib/import/readSettingArchive.ts`                            | Safe reader: caps, exact entry names, manifest/version check, Zod over every row         |
| 6   | `app/lib/import/writeSetting.ts`                                  | One transaction, dependency order, id remap table, rich-text link rewrite, images stored |
| 7   | `app/ui/import/**`, `app/lib/actions/**`-convention Server Action | Upload, dry-run summary, confirm                                                         |

**Risks**

- **A second place that knows the fields.** An exporter or importer with a hand-written field list is the drift the metadata layer exists to prevent; both read the metadata, and the round-trip test is what notices.
- **Remapping is where bugs hide.** A relation missed in the table imports silently pointing at nothing or, worse, at someone else's row. The round-trip test over every relation in `schema.prisma` is the guard; a new relation must fail it until mapped.
- **Untrusted input.** The zip is user-supplied: zip-slip, bombs, and image decoders (§5). Images go through the existing re-encoding pipeline and are never served as uploaded.
- **Transaction size.** A real setting (hundreds of places, a library of spells and items) is thousands of rows. Time it on a realistic one before setting the timeout — SPEC-032's copy transactions were timed the same way (§9 there).
- **Name drift in the format.** JSON keys are the English field names; the old library files (Italian keys) stay with `importLibrary.ts`, which this does not replace until the DM says so.

## 10. Task breakdown

One task, one PR, merged before the next. **Blocked on §9, questions 8–10 and on the DM agreeing the spec.**

- [ ] **T1** — `renderRecordMarkdown` and `htmlToMarkdown`, pure; a single record's and a list's Markdown export, DM only. _(test: every field in order; a new meta field appears; rich-text conversion over the allow-list; an unauthenticated request and a `player` are refused)_
- [ ] **T2** — Structured rows (`toRecordJson`) and the `manifest.json` format, with its version. _(test: the JSON of a record carries every field and the rich-text links as stored)_
- [ ] **T3** — ADR for the zip library; the whole-setting archive with images and `NOTICE.md`. _(test: archive contents and layout; no campaign, user or reveal; images present)_
- [ ] **T4** — `readSettingArchive` and the dry-run summary. _(test: each hostile zip of §8; an invalid row names its entry; nothing is written)_
- [ ] **T5** — `writeSetting`: records in dependency order with id remapping and rich-text link rewriting, one transaction. _(test: tree and relations survive; a failure part-way leaves nothing)_
- [ ] **T6** — Images through the existing pipelines, the import page, and the E2E round trip. _(test: export → import into the empty E2E world → export, compared up to ids)_

## 11. Outcome

_Fill in at close._

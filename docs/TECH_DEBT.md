# Technical Debt Register

**Last updated:** 2026-09-24
**What this file is for:** deciding what to work on next. It carries the summary table and the write-ups of items that are **still open** — nothing else. Every closed item's full write-up lives in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md), which is where to look for whether something was already tried and rejected.

**One item is open: TD-147**, filed on 2026-09-24 while implementing SPEC-023. Everything before it is closed and archived. The next thing found goes in as TD-148.

**Scope note.** TD-01 – TD-22 came out of the 2026-07-22 audit; TD-23 onward were found while doing the work, which is why the numbering is chronological rather than thematic. Each item is sized to be completable in one focused session.

**TD-47 – TD-57 and TD-60 have no write-up here, and that is not an oversight to fix.** Three different situations, verified 2026-08-08:

- **TD-47 – TD-55: nothing to transcribe.** A 2026-08-06 merge commit ("docs: record TD-47 – TD-57 from the 2026-08-04 audit pass", PR #80) claimed to record them; its actual diff added only `.env.example` and `dependabot.yml`. No PR, commit or doc anywhere in this repo's history says what these nine were about — most likely an external audit session (a Cowork pass, per `CLAUDE.md`'s "Bringing research into the codebase") whose findings were never committed.
- **TD-56 and TD-57 shipped as code but never got an entry.** They are the `.env.example` and `dependabot.yml` work in that same PR. The fixes are live; only the register entry is missing, and reconstructing one after the fact would be a guess.
- **TD-60 was never claimed by anything** — a skipped number.

**Do not re-litigate any of this by writing entries**, and do not reuse these IDs for new items; skip to the next free number, so a rediscovered write-up (if one ever surfaces) has an unambiguous home.

---

## Legend

| Severity    | Meaning                                                                    |
| ----------- | -------------------------------------------------------------------------- |
| 🔴 Critical | Security hole, data loss risk, or the project does not build/run correctly |
| 🟠 High     | Breaks something a normal five-minute walkthrough of the app would hit     |
| 🟡 Medium   | Real quality problem, not immediately visible                              |
| 🟢 Low      | Polish                                                                     |

Effort: **S** ≈ under 1h · **M** ≈ 1–3h · **L** ≈ half a day or more.

---

## Summary

| ID     | Severity | Effort | Item                                                                 |
| ------ | -------- | ------ | -------------------------------------------------------------------- |
| TD-147 | 🟠 High  | S      | Deleting a landmark somebody is assigned to fails on the foreign key |

**All 134 closed rows moved to the archive on 2026-09-22**, with the write-ups they
index — see [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md)'s _Index of every closed
item_. That list is the work queue, not a history of the project.

---

## Closed items — TD-01 through TD-146, all of them

Everything the 2026-07-22 audit found, plus everything found while doing the work through 2026-09-19, is closed: correctness, security, dead code, formatting, CI, accessibility, the metadata-layer types, the identifier rename, the bilingual UI, the migration drift, the E2E harness, the coverage sweep that crossed Phase 2's 70% gate, the whole SPEC-004 map/world-tree run, the clean-checkout `pnpm test` gap, the metadata layer's unguarded field-name collision, description fields rendering as unsanitised HTML, the entity-location read path duplication, the deity/magic-item/faction mutation coverage gap, SPEC-016/017's map work, and the September 2026 quality, accessibility and copy sweep (TD-112 – TD-146). The archive's _Index of every closed item_ carries the summary row for each.

**Each item's full write-up — what was found, why, the fix — is in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md)**, moved there in six passes (TD-01–TD-36 on 2026-08-01, TD-37–TD-75 on 2026-08-08, TD-76 and TD-77 on 2026-08-13, TD-80 on 2026-08-17, TD-81–TD-102 on 2026-08-31, and the remaining fifty-one on 2026-09-22). Nothing was deleted; the archive keeps every "(original)" problem framing exactly as recorded, per the policy in [`docs/README.md`](./README.md#keeping-them-honest).

---

## Open items

### TD-147 — Deleting a landmark with an entity assigned to it fails in the database

**Severity:** 🟠 High · **Effort:** S · **Found:** 2026-09-24, while implementing SPEC-023

`npc.poiId` and `deities.poiId` are `onDelete: Restrict`
(`20260808170000_add_zone_table_and_entity_location_fks`), and `deletePoi`
deletes the row with a single `prisma.poi.delete` — nothing detaches the
entities first. So deleting a landmark that an NPC or a deity is assigned to
raises a foreign-key error from Postgres. `usePOIManager.removeFromMap`
catches it, puts the marker back and shows `poiDeleteFailed`, so nothing is
corrupted and nothing is silently lost — but the DM is told "could not
delete" with no way to find out why, and no way forward short of finding
every entity assigned there and detaching it by hand.

`deletePlace` has the answer for the other table already (SPEC-010 rule 3):
the deletion is a transaction that first rewrites the rows pointing at what
is about to go. The landmark equivalent is the same shape, but **which**
rewrite is a product decision the DM has to make, and that is why this is
filed rather than fixed:

- **`zoneId` kept, `poiId` cleared** — the entity falls back to the
  enclosing place, exactly as a child falls back to the grandparent. Keeps
  ADR-0010's invariant trivially, and nothing needs inventing.
- **Both cleared** — the entity loses its location outright, as it does when
  the _place_ it was assigned to directly is deleted.

**Fix:** decide the above, then make `deletePoi` a transaction that performs
it before the delete, with a test per branch. Then SPEC-023's landmark
dialog can state the count the way the place dialog does — the reason it
says nothing about entities today is that there is no honest sentence to
write (`RemoveLandmarkDialog`'s docblock records this).

**Do not "fix" it by switching the foreign keys to `SET NULL`.** SPEC-010 §6
settled that for these same columns: `Restrict` is what makes an accidental
detach impossible to perform silently, and the application layer is where
the rewrite belongs, in one transaction, where it can be counted first.

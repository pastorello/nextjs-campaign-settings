# Technical Debt Register

**Last updated:** 2026-10-12
**What this file is for:** deciding what to work on next. It carries the summary table and the write-ups of items that are **still open** — nothing else. Every closed item's full write-up lives in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md), which is where to look for whether something was already tried and rejected.

**One item is open: TD-154**, filed 2026-10-15. TD-153, the last one closed, closed on 2026-10-12 and is archived with the rest.

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

| ID     | Title                                                       | Severity | Effort | Phase |
| ------ | ----------------------------------------------------------- | -------- | ------ | ----- |
| TD-154 | The seed ships Italian rulebook prose for eight SRD records | 🟠 High  | S      | 5     |

### TD-154 The seed ships Italian rulebook prose for eight SRD records

**Severity:** 🟠 High · **Effort:** S · **Found:** 2026-09-11 as finding 1 of
[`docs/domain/licensing.md`](./domain/licensing.md) §6; filed here 2026-10-15, while rewriting
`README.md`, because nothing had carried it into this register and the README was about to claim the
opposite.

`app/seed/initial-data/spells.ts` holds four SRD spells (Aiuto, Bacche Benefiche, Caduta Morbida,
Dardo Incantato) and `magicitems.ts` four SRD items (Anello di Rigenerazione, Bacchetta dei Segreti,
Cintura della Forza dei Giganti, Difensiva) whose descriptions are the Italian _Player's Handbook_ /
_Dungeon Master's Guide_ translation — not the CC-licensed Italian SRD, which is a different
translation of overlapping content. That is protected expression in a public repository, and it is
the one place the repo breaks its own rule (`CLAUDE.md`: mechanics restated, never text;
`licensing.md` §7 rule 3: rulebook text, official translations included, is private-database content
only). `importLibrary.ts` already documents the rule for the DM's real library and keeps it
gitignored; the seed slipped past because it is small.

**Fix (the simpler of the two the analysis offers):** replace the eight descriptions with invented
placeholder prose, which needs no notice at all and matches the custom-only rule. The alternative —
substituting the official Italian SRD wording and adding the CC-BY attribution statement — carries a
notice obligation for demo data that exists only to populate a page. Watch for E2E and unit
assertions on seeded descriptions, and for `rich-text` fixtures that may read one of them.

---

**All 134 closed rows moved to the archive on 2026-09-22**, with the write-ups they
index — see [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md)'s _Index of every closed
item_. That list is the work queue, not a history of the project.

---

## Closed items — TD-01 through TD-153

Everything the 2026-07-22 audit found, plus everything found while doing the work through 2026-09-19, is closed: correctness, security, dead code, formatting, CI, accessibility, the metadata-layer types, the identifier rename, the bilingual UI, the migration drift, the E2E harness, the coverage sweep that crossed Phase 2's 70% gate, the whole SPEC-004 map/world-tree run, the clean-checkout `pnpm test` gap, the metadata layer's unguarded field-name collision, description fields rendering as unsanitised HTML, the entity-location read path duplication, the deity/magic-item/faction mutation coverage gap, SPEC-016/017's map work, and the September 2026 quality, accessibility and copy sweep (TD-112 – TD-146). The archive's _Index of every closed item_ carries the summary row for each.

**Each item's full write-up — what was found, why, the fix — is in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md)**, moved there in six passes (TD-01–TD-36 on 2026-08-01, TD-37–TD-75 on 2026-08-08, TD-76 and TD-77 on 2026-08-13, TD-80 on 2026-08-17, TD-81–TD-102 on 2026-08-31, and the remaining fifty-one on 2026-09-22), plus TD-147 to TD-150 on 2026-09-30, the day TD-148 to TD-150 were filed, TD-151 and TD-152 on 2026-10-01, each filed and closed the same day, and TD-153 on 2026-10-12 (filed 2026-10-01). Nothing was deleted; the archive keeps every "(original)" problem framing exactly as recorded, per the policy in [`docs/README.md`](./README.md#keeping-them-honest).

---

## Open items

None.

# Technical Debt Register

**Last updated:** 2026-11-05
**What this file is for:** deciding what to work on next. It carries the summary table and the write-ups of items that are **still open** — nothing else. Every closed item's full write-up lives in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md), which is where to look for whether something was already tried and rejected.

**One item is open, TD-156**, filed 2026-11-05 with Storybook (ADR-0021). Its first two batches found TD-157 and TD-158, and TD-155 came before them; all three were filed and closed the same day and are archived with the rest. The next thing found goes in as TD-159.

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

## Summary

| ID     | Item                                | Severity | Effort | Phase |
| ------ | ----------------------------------- | -------- | ------ | ----- |
| TD-156 | 106 UI components have no story yet | 🟢 Low   | L      | 5     |

**All 134 closed rows moved to the archive on 2026-09-22**, with the write-ups they
index — see [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md)'s _Index of every closed
item_. That list is the work queue, not a history of the project.

---

## Closed items — TD-01 through TD-155

Everything the 2026-07-22 audit found, plus everything found while doing the work through 2026-09-19, is closed: correctness, security, dead code, formatting, CI, accessibility, the metadata-layer types, the identifier rename, the bilingual UI, the migration drift, the E2E harness, the coverage sweep that crossed Phase 2's 70% gate, the whole SPEC-004 map/world-tree run, the clean-checkout `pnpm test` gap, the metadata layer's unguarded field-name collision, description fields rendering as unsanitised HTML, the entity-location read path duplication, the deity/magic-item/faction mutation coverage gap, SPEC-016/017's map work, and the September 2026 quality, accessibility and copy sweep (TD-112 – TD-146). The archive's _Index of every closed item_ carries the summary row for each.

**Each item's full write-up — what was found, why, the fix — is in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md)**, moved there in six passes (TD-01–TD-36 on 2026-08-01, TD-37–TD-75 on 2026-08-08, TD-76 and TD-77 on 2026-08-13, TD-80 on 2026-08-17, TD-81–TD-102 on 2026-08-31, and the remaining fifty-one on 2026-09-22), plus TD-147 to TD-150 on 2026-09-30, the day TD-148 to TD-150 were filed, TD-151 and TD-152 on 2026-10-01, each filed and closed the same day, TD-153 on 2026-10-12 (filed 2026-10-01), TD-154 on 2026-10-15, filed and closed the same day, and TD-155 on 2026-11-05, likewise. Nothing was deleted; the archive keeps every "(original)" problem framing exactly as recorded, per the policy in [`docs/README.md`](./README.md#keeping-them-honest).

---

## Open items

### TD-156 🟢 106 UI components have no story yet

**Filed 2026-11-05** with ADR-0021. The first change covered the shared layer: buttons, form inputs, components, typography, the dashboard chrome, the login form and one domain form (`SpellForm`). It also set up the infrastructure and patterns for the rest. The remaining components are listed by domain in `.storybook/pendingStories.ts`. `storyCoverage.test.ts` keeps that list honest: a new component with no story fails `pnpm test`, and so does a pending entry a story now covers.

**Plan:** one PR per batch, each removing its lines from `PENDING_STORIES`:

1. ~~5e domains: spells, magic items, NPC, deities, factions, treasures (cards, forms, libraries).~~ Done 2026-11-05: 26 stories in 18 files, fixtures in `.storybook/fixtures/`.
2. ~~Daggerheart: `daggerheart/` and the eleven `dh*` folders.~~ Done 2026-11-05: 48 components, one story file each, fixtures in `.storybook/fixtures/daggerheart.ts`. Found TD-158.
3. Campaigns and calendar.
4. Geography and `app/modules/maps`. Leaflet renders in the browser runner, but the map's data hooks call several Server Actions, so these stories need the most fixtures.
5. What is left: accounts, search, rich text, the data shells (`EntityList`, `EntityLibrary`, `ListPage`, `cards.tsx`), `ModalButton`, `ImageInput`, the location assignment components.

Batches 1–3 are mechanical once the patterns exist (`.storybook/fixtures/`, `SpellForm.stories.tsx`, `docs/TESTING.md` §Stories). **Done when** `PENDING_STORIES` is empty and deleted.

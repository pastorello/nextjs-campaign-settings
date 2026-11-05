# Technical Debt Register

**Last updated:** 2026-11-05
**What this file is for:** deciding what to work on next. It carries the summary table and the write-ups of items that are **still open** — nothing else. Every closed item's full write-up lives in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md), which is where to look for whether something was already tried and rejected.

**Three items are open, TD-156, TD-158 and TD-159**, filed 2026-11-05 with Storybook (ADR-0021). Batch 2 of TD-156 found TD-158 and batch 3 found TD-159. The last two closed, TD-155 and TD-157, were filed and closed the same day and are archived with the rest; TD-157, found by batch 1, undid half of TD-155. The next thing found goes in as TD-160.

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

### TD-159 🟢 The NPC link in a scene's creature row fails `label-content-name-mismatch`

**Filed 2026-11-05** by TD-156 batch 3. `SceneCreatureList` links a creature to its NPC page with the visible text `sceneCreature.list.npcLink` ("Scheda PNG") but an `aria-label` of `npcLinkLabel` ("Scheda del PNG {name}"), which does not contain it. WCAG 2.5.3 wants the visible text inside the accessible name. English passes by luck ("NPC page" / "NPC page for {name}"); Italian does not. The statistics link beside it is fine ("Statistiche di {name} …" starts with "Statistiche").

Every story of `SceneCreatureList` and `SceneList` that shows a creature row linked to an NPC carries `a11y: { test: "todo" }` until this is fixed.

**Fix:** reword `sceneCreature.list.npcLinkLabel` in `it.json` so it starts with the visible text ("Scheda PNG di {name}"), then drop the `todo` parameters. Search the other `aria-label`s built from a catalogue key for the same mismatch (TD-158 found one in `DhSubclassFeatureList`).

### TD-158 🟢 Inline feature lists break heading order in edit forms

**Filed 2026-11-05** by TD-156 batch 2. Two axe findings, both in the Daggerheart edit forms:

- **`heading-order`.** `EntityForm` titles itself with `PageTitle`, an `h1`. The inline lists under it (`InlineOrderedList`, `DhClassFeatureList`, `DhSubclassFeatureList`) title themselves with an `h3`, skipping `h2`. It shows in the Edit story of `DhAdversaryForm`, `DhClassForm`, `DhEnvironmentForm` and `DhSubclassForm`.
- **`label-content-name-mismatch`.** `DhSubclassFeatureList`'s per-tier add button has the visible text of `dhSubclasses.features.addButton` but an `aria-label` of `addToTier` ("Aggiungi un privilegio: {tier}"), which does not contain it. WCAG 2.5.3 wants the visible text inside the accessible name.

Those four Edit stories, and the stories of `DhSubclassFeatureList`, carry `a11y: { test: "todo" }` until this is fixed.

**Fix:** the list title at the level the page gives it (a prop, or `h2`), and the add button's `aria-label` starting with its visible text. Then drop the `todo` parameters. Check the 5e `LootList`-shaped lists for the same heading skip.

---

## Summary

| ID     | Item                                                   | Severity | Effort | Phase |
| ------ | ------------------------------------------------------ | -------- | ------ | ----- |
| TD-159 | Scene NPC link: label omits its visible text           | 🟢 Low   | S      | 5     |
| TD-158 | Inline feature lists break heading order in edit forms | 🟢 Low   | S      | 5     |
| TD-156 | 62 UI components have no story yet                     | 🟢 Low   | L      | 5     |

**All 134 closed rows moved to the archive on 2026-09-22**, with the write-ups they
index — see [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md)'s _Index of every closed
item_. That list is the work queue, not a history of the project.

---

## Closed items — TD-01 through TD-155

Everything the 2026-07-22 audit found, plus everything found while doing the work through 2026-09-19, is closed: correctness, security, dead code, formatting, CI, accessibility, the metadata-layer types, the identifier rename, the bilingual UI, the migration drift, the E2E harness, the coverage sweep that crossed Phase 2's 70% gate, the whole SPEC-004 map/world-tree run, the clean-checkout `pnpm test` gap, the metadata layer's unguarded field-name collision, description fields rendering as unsanitised HTML, the entity-location read path duplication, the deity/magic-item/faction mutation coverage gap, SPEC-016/017's map work, and the September 2026 quality, accessibility and copy sweep (TD-112 – TD-146). The archive's _Index of every closed item_ carries the summary row for each.

**Each item's full write-up — what was found, why, the fix — is in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md)**, moved there in six passes (TD-01–TD-36 on 2026-08-01, TD-37–TD-75 on 2026-08-08, TD-76 and TD-77 on 2026-08-13, TD-80 on 2026-08-17, TD-81–TD-102 on 2026-08-31, and the remaining fifty-one on 2026-09-22), plus TD-147 to TD-150 on 2026-09-30, the day TD-148 to TD-150 were filed, TD-151 and TD-152 on 2026-10-01, each filed and closed the same day, TD-153 on 2026-10-12 (filed 2026-10-01), TD-154 on 2026-10-15, filed and closed the same day, and TD-155 on 2026-11-05, likewise. Nothing was deleted; the archive keeps every "(original)" problem framing exactly as recorded, per the policy in [`docs/README.md`](./README.md#keeping-them-honest).

---

## Open items

### TD-156 🟢 62 UI components have no story yet

**Filed 2026-11-05** with ADR-0021. The first change covered the shared layer: buttons, form inputs, components, typography, the dashboard chrome, the login form and one domain form (`SpellForm`). It also set up the infrastructure and patterns for the rest. The remaining components are listed by domain in `.storybook/pendingStories.ts`. `storyCoverage.test.ts` keeps that list honest: a new component with no story fails `pnpm test`, and so does a pending entry a story now covers.

**Plan:** one PR per batch, each removing its lines from `PENDING_STORIES`:

1. ~~5e domains: spells, magic items, NPC, deities, factions, treasures (cards, forms, libraries).~~ Done 2026-11-05: 26 stories in 18 files, fixtures in `.storybook/fixtures/`.
2. ~~Daggerheart: `daggerheart/` and the eleven `dh*` folders.~~ Done 2026-11-05: 48 components, one story file each, fixtures in `.storybook/fixtures/daggerheart.ts`. Found TD-158.
3. ~~Campaigns and calendar.~~ Done 2026-11-05: 44 components in 44 story files, fixtures in `.storybook/fixtures/campaigns.ts` and `calendar.ts`. Found TD-159.
4. Geography and `app/modules/maps`. Leaflet renders in the browser runner, but the map's data hooks call several Server Actions, so these stories need the most fixtures.
5. What is left: accounts, search, rich text, the data shells (`EntityList`, `EntityLibrary`, `ListPage`, `cards.tsx`), `ModalButton`, `ImageInput`, the location assignment components.

Batches 1–3 are mechanical once the patterns exist (`.storybook/fixtures/`, `SpellForm.stories.tsx`, `docs/TESTING.md` §Stories). **Done when** `PENDING_STORIES` is empty and deleted.

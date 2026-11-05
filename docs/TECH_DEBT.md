# Technical Debt Register

**Last updated:** 2026-11-05
**What this file is for:** deciding what to work on next. It carries the summary table and the write-ups of items that are **still open** — nothing else. Every closed item's full write-up lives in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md), which is where to look for whether something was already tried and rejected.

**Nine items are open, TD-156, TD-159 and TD-161 – TD-167**, filed 2026-11-05 with Storybook (ADR-0021). Batch 3 of TD-156 found TD-159 and batch 4 found TD-161 – TD-167 (axe findings). The closed ones, TD-155, TD-157, TD-158 and TD-160 (an E2E time budget), were filed and closed the same day and are archived with the rest; TD-157, found by batch 1, undid half of TD-155, and TD-158 came from batch 2. The next thing found goes in as TD-168.

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

---

## Summary

| ID     | Item                                                                | Severity | Effort | Phase |
| ------ | ------------------------------------------------------------------- | -------- | ------ | ----- |
| TD-159 | Scene NPC link: label omits its visible text                        | 🟢 Low   | S      | 5     |
| TD-161 | The map upload dialog has no accessible name                        | 🟢 Low   | S      | 5     |
| TD-162 | A place's entity list repeats each name as image alt text           | 🟢 Low   | S      | 5     |
| TD-163 | The destructive removal choice fails contrast when selected         | 🟢 Low   | S      | 5     |
| TD-164 | The map error screen's "Riprova" button fails contrast              | 🟢 Low   | S      | 5     |
| TD-165 | The vendored map starter components fail four axe rules             | 🟢 Low   | M      | 5     |
| TD-166 | The map's context menu is a `menu` of buttons, with a faint heading | 🟢 Low   | S      | 5     |
| TD-167 | The landmark panel has unnamed selects and a faint empty state      | 🟢 Low   | S      | 5     |
| TD-156 | 30 UI components have no story yet                                  | 🟢 Low   | L      | 5     |

**All 134 closed rows moved to the archive on 2026-09-22**, with the write-ups they
index — see [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md)'s _Index of every closed
item_. That list is the work queue, not a history of the project.

---

## Closed items — TD-01 through TD-155

Everything the 2026-07-22 audit found, plus everything found while doing the work through 2026-09-19, is closed: correctness, security, dead code, formatting, CI, accessibility, the metadata-layer types, the identifier rename, the bilingual UI, the migration drift, the E2E harness, the coverage sweep that crossed Phase 2's 70% gate, the whole SPEC-004 map/world-tree run, the clean-checkout `pnpm test` gap, the metadata layer's unguarded field-name collision, description fields rendering as unsanitised HTML, the entity-location read path duplication, the deity/magic-item/faction mutation coverage gap, SPEC-016/017's map work, and the September 2026 quality, accessibility and copy sweep (TD-112 – TD-146). The archive's _Index of every closed item_ carries the summary row for each.

**Each item's full write-up — what was found, why, the fix — is in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md)**, moved there in six passes (TD-01–TD-36 on 2026-08-01, TD-37–TD-75 on 2026-08-08, TD-76 and TD-77 on 2026-08-13, TD-80 on 2026-08-17, TD-81–TD-102 on 2026-08-31, and the remaining fifty-one on 2026-09-22), plus TD-147 to TD-150 on 2026-09-30, the day TD-148 to TD-150 were filed, TD-151 and TD-152 on 2026-10-01, each filed and closed the same day, TD-153 on 2026-10-12 (filed 2026-10-01), TD-154 on 2026-10-15, filed and closed the same day, and TD-155 on 2026-11-05, likewise. Nothing was deleted; the archive keeps every "(original)" problem framing exactly as recorded, per the policy in [`docs/README.md`](./README.md#keeping-them-honest).

---

## Open items

### TD-161 🟢 The map upload dialog has no accessible name

**Filed 2026-11-05** by TD-156 batch 4. `MapUploadControl` opens its dialog with `title=""`, on purpose: the file input already has a label, and a title would duplicate it (the comment in the file says so). But Headless UI names the dialog from its title, so the dialog itself has none: axe `aria-dialog-name`. All three stories of `MapUploadControl` carry `a11y: { test: "todo" }`.

**Fix:** give `Modal` a way to name the dialog without printing a visible title (an `aria-label`), or title it "Carica la mappa". Then drop the `todo`.

### TD-162 🟢 A place's entity list repeats each name as image alt text

**Filed 2026-11-05** by TD-156 batch 4. `PlaceEntityList` renders `RecordThumbnail` (whose `alt` is the record's name) right beside the same name as text: axe `image-redundant-alt`. Only the `Listed` story of `PlaceEntityList` has a portrait, and carries `todo`.

**Fix:** pass an empty `alt` where the name is adjacent (a `RecordThumbnail` prop), keeping the name as alt where the image stands alone. Check the other lists that put a thumbnail beside its name.

### TD-163 🟢 The destructive removal choice fails contrast when selected

**Filed 2026-11-05** by TD-156 batch 4. In `RemovalOutcomeChoices` the "Elimina definitivamente" label is `text-red-600`, and a selected row is `bg-indigo-50`: under 4.5:1 (`color-contrast`). It shows in the `DestructiveChosen` story, which carries `todo`.

**Fix:** `text-red-700` for the destructive label, as TD-155 did elsewhere. Then drop the `todo`.

### TD-164 🟢 The map error screen's "Riprova" button fails contrast

**Filed 2026-11-05** by TD-156 batch 4. `MapErrorBoundary`'s "Riprova" is white on `bg-blue-500`, 3.76:1 against 4.5:1. It is live code, `GeographyExplorer` wraps the map in it. The `Failed` story carries `todo`.

**Fix:** `bg-blue-600` (check its hover), then drop the `todo`.

### TD-165 🟢 The vendored map starter components fail four axe rules

**Filed 2026-11-05** by TD-156 batch 4. All in the vendored, unwired `app/modules/maps/components/map/`, which is not to be edited without asking (CLAUDE.md, "unused is not dead"), so this item exists to decide, not to fix blindly:

- `MapTileSwitcher`: the main button's `aria-label` ("Tile layer options") does not contain its visible text (`label-content-name-mismatch`).
- `MapDetailsPanel`: the "Directions" label is white 10px text on teal, 3.66:1 (`color-contrast`).
- `MapSearchBar`: the results `listbox` holds buttons, not `option`s (`aria-required-children`).
- `MapMain` mounts `MapTileSwitcher`, so its one story inherits the first.

Those stories carry `todo`. **Decide** whether each is fixed, or the component is deleted if the DM confirms it will never be wired. `MapMain` also asks OpenStreetMap for tiles; its story answers them with Leaflet's `getTileUrl`, since a story may not reach the network.

### TD-166 🟢 The map's context menu is a `menu` of buttons, with a faint heading

**Filed 2026-11-05** by TD-156 batch 4. `MapContextMenu` is `role="menu"`, but its entries are plain `<button>`s and a search input: `aria-required-children`. The picker's group headings ("Su questa mappa") are `text-gray-400` on white, 2.6:1. Every open story of the file carries `todo`.

**Fix:** either `role="menuitem"` on the entries (and arrow-key handling that already exists) or drop `role="menu"` for a labelled group of buttons; `text-gray-600` on the headings.

### TD-167 🟢 The landmark panel has unnamed selects and a faint empty state

**Filed 2026-11-05** by TD-156 batch 4. In `MapPOIPanel`'s form the kind and category `<select>`s sit under a `<label>` with no `htmlFor` (`select-name`), and the empty state's subtitle is `text-gray-400`, 2.6:1. The `Add`, `Edit` and `Empty` stories carry `todo`.

**Fix:** associate the labels (`htmlFor`/`id`), `text-gray-600` on the subtitle.

### TD-156 🟢 30 UI components have no story yet

**Filed 2026-11-05** with ADR-0021. The first change covered the shared layer: buttons, form inputs, components, typography, the dashboard chrome, the login form and one domain form (`SpellForm`). It also set up the infrastructure and patterns for the rest. The remaining components are listed by domain in `.storybook/pendingStories.ts`. `storyCoverage.test.ts` keeps that list honest: a new component with no story fails `pnpm test`, and so does a pending entry a story now covers.

**Plan:** one PR per batch, each removing its lines from `PENDING_STORIES`:

1. ~~5e domains: spells, magic items, NPC, deities, factions, treasures (cards, forms, libraries).~~ Done 2026-11-05: 26 stories in 18 files, fixtures in `.storybook/fixtures/`.
2. ~~Daggerheart: `daggerheart/` and the eleven `dh*` folders.~~ Done 2026-11-05: 48 components, one story file each, fixtures in `.storybook/fixtures/daggerheart.ts`. Found TD-158.
3. ~~Campaigns and calendar.~~ Done 2026-11-05: 44 components in 44 story files, fixtures in `.storybook/fixtures/campaigns.ts` and `calendar.ts`. Found TD-159.
4. ~~Geography and `app/modules/maps`.~~ Done 2026-11-05: 40 components in 40 story files. The map fixtures (a drawn PNG map, `MapStage`, `mockWorld`) are in `.storybook/fixtures/maps.tsx` and `.storybook/public/api/maps/`. Found TD-161 – TD-167. `MapMain` is vendored and asks OpenStreetMap for tiles; it renders in isolation only because its story answers Leaflet's `getTileUrl`.
5. What is left: accounts, search, rich text, the data shells (`EntityList`, `EntityLibrary`, `ListPage`, `cards.tsx`), `ModalButton`, `ImageInput`, the location assignment components.

Batches 1–4 are mechanical once the patterns exist (`.storybook/fixtures/`, `SpellForm.stories.tsx`, `docs/TESTING.md` §Stories). **Done when** `PENDING_STORIES` is empty and deleted.

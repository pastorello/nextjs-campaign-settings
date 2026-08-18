# SPEC-013: Campaign management

- **Status:** Draft — awaiting agreement
- **Date:** 2026-08-18
- **Phase:** ROADMAP Phase 4 (Session tooling)
- **Related:** [`docs/domain/campaign-design-method.md`](../domain/campaign-design-method.md) · [SPEC-004](./004-world-model.md) (world tree) · [SPEC-010](./010-deleting-a-place.md) (place deletion) · [SPEC-011](./011-cross-entity-search.md) · [SPEC-001](./001-combat-tracker.md) (successor, not prerequisite) · ADR-0009/0010 · ROADMAP Phase 3, "Campaigns as stories, not as scoping"

---

## 1. Problem

The app holds everything a campaign is _made of_ — spells, magic items, NPCs,
deities, factions, and a navigable world tree with maps — and nothing that says
what the campaign _is_. The DM designs the campaign itself in a spreadsheet:
twenty adventures, one per character level, each a list of scenes with the
monsters, the treasure, the clues and the places they happen in.

That spreadsheet does two jobs, and does both badly:

- **Designing.** Writing an adventure means checking it against per-level
  budgets — how much treasure, how many permanent items, how many consumables
  are still unassigned. Those figures are hand-summed and already drift; the
  hero-point count was out by one in the second adventure.
- **Running.** At the table the DM ticks off what the party earned and what they
  actually looted — two marks that diverge constantly, because a party can win a
  fight and never search the room. Doing it in a spreadsheet on a laptop, mid-session,
  is where it breaks down.

And the two halves never meet: a scene names its place as the string
`04D - Fogne di Skreebars`, while the app already holds that place, with its map,
its NPCs and its faction, one click away — in a system that has no idea the scene
exists.

## 2. Goal

The DM designs a campaign's adventures inside the app — scenes, creatures,
treasure, each scene anchored to a real place in the world tree — and, during
play, ticks off experience and loot as they are earned, against budgets the app
keeps totalled.

## 3. Non-goals

- **Not a rules engine.** The app computes no encounter difficulty and derives no
  XP or treasure from any system's tables. Every number is authored by the DM;
  the app only sums and compares them. See the domain file §6 for why.
- **Not the combat tracker.** Running a fight round by round is [SPEC-001](./001-combat-tracker.md),
  which this spec is a prerequisite for, not a part of. A scene with its creatures
  is what SPEC-001 will eventually be handed.
- **Not a session diary.** Recording what actually happened, after play, is a
  separate feature the DM has asked to discuss later. This spec covers _planned_
  events only, and does so as free text (§5).
- **Not campaign scoping.** No `campaignId` goes on `spells`, `npc`, `deities`,
  `magicitems` or `zone`. The Phase 3 decision stands: a campaign is a storyline
  inside the one universe, not a boundary around every record.
- **Not multi-user and not player-facing.** Single DM, single screen, same as the
  rest of the app. No sharing, no player view, no print/PDF export.
- **Not branching.** Adventures are a sequence and scenes are a list. No
  alternate paths, no conditional unlocks.
- **Not a migration of the existing spreadsheet.** The DM has stated the
  spreadsheet is an example of the method, not data to carry over; the app starts
  empty and the DM authors into it. Importing the twenty sheets' _content_ is a
  candidate follow-up, not part of this spec — see §9, Open questions.

## 4. User stories

- As a DM, I want to write an adventure as an ordered list of scenes, so that
  the structure I already design on paper exists somewhere the app can use.
- As a DM, I want each scene to point at a real place in my world, so that I can
  open that place's map from the scene instead of hunting for it.
- As a DM, I want to see how much treasure, how many permanent items and how many
  consumables I have **left to assign** for this level, so that I can finish
  writing the adventure without a calculator.
- As a DM, I want to tick off experience and loot **while I am running the
  session**, in one click, so that I do not have to reconstruct it afterwards.
- As a DM, I want to see what the party **did not** find, so that I can route
  that wealth back to them another way.
- As a DM, I want to know which adventure is the current one and what level it
  targets, so that the campaign's state is a fact rather than something I
  remember.

## 5. Behaviour

**Main flow — designing**

1. The DM opens _Campagna_ from the dashboard. On first use there is no campaign;
   a form creates one (title, synopsis, party size).
2. The campaign page shows its adventures as an ordered ladder — position, target
   level, title, status (planned / active / completed) and a progress readout.
   An adventure is added with a position, a target level and a title.
3. The adventure page shows the adventure's own information (synopsis, planned
   timeline, budgets) and its scenes in order.
4. A scene is added with a kind (`fight` · `explore` · `clue` · `goal` ·
   `dungeon` · `break`), a title, a description, an optional XP award, an
   optional hero-point flag, and an optional **place** chosen from the world tree.
5. Within a scene the DM adds creatures (name, level, XP each, quantity,
   optionally linked to an existing NPC) and treasure (description, kind, value,
   quantity, optionally linked to an existing magic item).
6. A budget panel on the adventure shows, for each of experience, currency,
   permanent items and consumables, three figures: **target · assegnato ·
   trovato**, with the two differences named — what is left to place, and what the
   party missed.

**Main flow — running**

7. During a session the DM works down the adventure's scenes. Each scene, each
   creature and each treasure row carries a check control. One click marks
   experience awarded (scene, creature) or loot taken (treasure); the budget panel
   updates without a page reload.
8. A scene's place, where set, is a link that opens that place's map.

**Edge cases**

| Situation                                | Expected behaviour                                                                                                                                 |
| ---------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------- |
| No campaign yet                          | Empty state with a single call to action; no empty ladder, no zero-filled budget panel.                                                            |
| Adventure with no scenes                 | Empty state inviting the first scene; budgets show target and `0` assigned, not blanks.                                                            |
| Budget target not set                    | The row reads `—`, not `0`. An unset target is not a target of zero.                                                                               |
| Scene with no place                      | Renders as "Luogo non assegnato" with a control to pick one — the same treatment SPEC-007 gave unplaced records.                                   |
| Scene's place is deleted                 | `scene.zoneId` is set to null, never cascading the scene away. SPEC-010 reparents children; a scene is not a child of a place and must survive it. |
| Creature links to an NPC that is deleted | Same: the link nulls, the authored name and numbers stay.                                                                                          |
| Two adventures at the same target level  | Allowed. Position, not level, orders the ladder — the DM intends standalone adventures later (§9).                                                 |
| Reordering scenes / adventures           | Explicit integer position, editable; not derived from creation order.                                                                              |
| Rapid repeat clicks on a check control   | Idempotent — the control sets a state, it does not toggle a counter.                                                                               |
| Very long adventure (50+ scenes)         | The scene list is the page's main content and paginates nothing; the budget panel stays visible while scrolling.                                   |
| Unauthenticated request to any mutation  | Rejected, as everywhere else.                                                                                                                      |

## 6. Data model changes

Six new tables, no change to any existing one. New tables use English column
names — the Italian columns elsewhere are legacy decoupled by `@map`, not a
convention to extend (`CLAUDE.md`, _Language conventions_).

```prisma
// proposed
model campaign {
  id        Int      @id @default(autoincrement())
  title     String
  synopsis  String?
  partySize Int      @default(4)
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  adventures adventure[]
}

model adventure {
  id         Int       @id @default(autoincrement())
  campaignId Int?
  campaign   campaign? @relation(fields: [campaignId], references: [id], onDelete: Restrict)

  position    Int
  targetLevel Int
  title       String
  synopsis    String?
  timeline    String?  // the planned calendar of §5, free text
  status      String   // planned | active | completed — closed vocabulary in code

  xpTarget            Int?
  currencyTarget      Int?
  currencyUnit        String? // "argento" / "oro" — campaign content, never translated
  permanentItemTarget Int?
  consumableTarget    Int?

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  scenes scene[]

  @@index([campaignId])
}

model scene {
  id          Int       @id @default(autoincrement())
  adventureId Int
  adventure   adventure @relation(fields: [adventureId], references: [id], onDelete: Cascade)

  position        Int
  kind            String  // fight | explore | clue | goal | dungeon | break
  title           String
  description     String?
  xpAward         Int?
  grantsHeroPoint Boolean @default(false)
  awarded         Boolean @default(false)

  zoneId Int?
  zone   zone? @relation(fields: [zoneId], references: [id], onDelete: SetNull)

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  creatures sceneCreature[]
  treasures treasure[]

  @@index([adventureId])
  @@index([zoneId])
}

model sceneCreature {
  id      Int   @id @default(autoincrement())
  sceneId Int
  scene   scene @relation(fields: [sceneId], references: [id], onDelete: Cascade)

  position Int
  name     String
  level    Int?
  xpEach   Int?
  quantity Int     @default(1)
  note     String?
  awarded  Boolean @default(false)

  npcId Int?
  npc   npc? @relation(fields: [npcId], references: [id], onDelete: SetNull)

  @@index([sceneId])
}

model treasure {
  id      Int   @id @default(autoincrement())
  sceneId Int
  scene   scene @relation(fields: [sceneId], references: [id], onDelete: Cascade)

  position    Int
  description String
  kind        String  // currency | permanent | consumable — closed vocabulary in code
  value       Int?    // in the adventure's currency unit
  quantity    Int     @default(1)
  taken       Boolean @default(false)

  magicItemId Int?
  magicitem   magicitems? @relation(fields: [magicItemId], references: [id], onDelete: SetNull)

  @@index([sceneId])
}
```

- **Backfill needed?** No. Every table is new and starts empty.
- **Reversible?** Yes — dropping the six tables restores the previous schema
  exactly, since nothing existing is altered. The three new nullable foreign keys
  live on the _new_ side of each relation.
- **`campaignId` is nullable from the start.** Not speculation: the DM has stated
  the intent to author standalone adventures (five at level 6, played in any
  order) alongside campaigns. A nullable column now costs nothing; adding one to a
  populated table later costs a migration and a backfill.
- **Derived, never stored:** every total in the budget panel — assigned and found
  experience, currency, permanent and consumable counts, and the hero-point
  count. Storing them is what let the spreadsheet drift.

**Currency counting rule:** an item's `value` counts toward the currency total
regardless of its `kind`, matching how the DM's own sheet totals a jade pendant's
worth into the silver column. Its `quantity` additionally counts toward the
permanent or consumable target. To confirm before T2 (§9).

## 7. Metadata changes

`campaign` and `adventure` are ordinary flat entities and fit the metadata layer
as it stands: a `PageMeta` per field in `app/lib/config/campaigns/`, composed into
`pageMetaFields.ts` and ordered in `pagesConfig.ts`, driving form, list and
validation exactly as the other six domains do.

`scene`, `sceneCreature` and `treasure` do not. They are **ordered collections
edited inline inside a parent's page** — a shape `EntityForm` has never had to
render, since every existing domain is one flat record per form. This is a real
architectural fork and `CLAUDE.md` forbids resolving it by hardcoding fields in a
component:

- **(a)** extend `PageMeta` with a collection field type, so nested rows stay
  metadata-driven;
- **(b)** keep the scene editor as bespoke components under `app/ui/campaigns/`,
  with `PageMeta` still supplying each row's validators, and record the boundary.

**An ADR decides this before T3, and it is on the critical path.** Current lean is
(b) — the metadata layer's value is that one declaration drives form, column,
filter and query, and a nested inline collection has no list column and no filter
to drive — but the ADR is where that gets argued, not this spec.

## 8. Acceptance criteria

- [ ] A DM with no campaign sees an empty state and can create one.
- [ ] An adventure can be created with a position, a target level and a title, and
      appears in the campaign ladder in position order.
- [ ] A scene can be created with each of the six kinds, and appears in the
      adventure in position order.
- [ ] A scene can be linked to a place in the world tree, and the link opens that
      place's map.
- [ ] A scene with no place renders an explicit "not assigned" state, not a blank.
- [ ] Deleting a linked place leaves the scene intact with its place unset.
- [ ] Creatures and treasure can be added to a scene, and the creature's XP total
      is `xpEach × quantity`.
- [ ] The budget panel shows target, assigned and found for experience, currency,
      permanent items and consumables, and an unset target renders as `—`.
- [ ] Marking a scene, creature or treasure updates the budget panel without a
      full page reload, and the state survives a reload.
- [ ] Assigned and found are independent: marking a fight awarded does not mark
      its treasure taken.
- [ ] The hero-point count is derived from the scenes that grant one.
- [ ] Every new mutation rejects an unauthenticated request.
- [ ] Every new mutation rejects invalid input with field-level errors.
- [ ] Every new user-facing string exists in both `messages/it.json` and
      `messages/en.json`; campaign content is never translated.
- [ ] axe reports zero violations on the campaign and adventure pages, and both
      are completable with the keyboard alone.
- [ ] Coverage has not dropped.

## 9. Implementation plan

**Files touched, in order**

| #   | File                                                                 | Change                                                                                    |
| --- | -------------------------------------------------------------------- | ----------------------------------------------------------------------------------------- |
| 1   | `docs/adr/0011-nested-collections-and-the-metadata-layer.md`         | New — decides §7                                                                          |
| 2   | `prisma/schema.prisma` + migration                                   | The six tables                                                                            |
| 3   | `app/lib/definitions/**`                                             | `SceneKind`, `TreasureKind`, `AdventureStatus`, interfaces                                |
| 4   | `app/lib/config/campaigns/**`, `pageMetaFields.ts`, `pagesConfig.ts` | Metadata for campaign/adventure                                                           |
| 5   | `app/lib/data/campaigns/**`                                          | One function per file: fetch campaign, adventure with scenes, budget totals               |
| 6   | `app/lib/actions/**`                                                 | Create/update/delete/reorder + the check-off toggles, each auth-guarded and Zod-validated |
| 7   | `app/[locale]/dashboard/campaign/**`                                 | Campaign page, adventure page                                                             |
| 8   | `app/ui/campaigns/**`                                                | Ladder, scene list, scene editor, budget panel, check controls                            |
| 9   | `messages/{it,en}.json`                                              | Both catalogues, same key set                                                             |
| 10  | `docs/PROJECT_STATE.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`   | Inventory, Phase 4, and the metadata-layer boundary the ADR sets                          |

**Risks**

- **The ADR is on the critical path.** Getting §7 wrong means either a bespoke
  editor that quietly bypasses the app's core abstraction, or a speculative
  generalisation of `PageMeta` that serves exactly one caller.
- **The at-the-table interaction is the part tests will not catch.** One-click
  marking has to be fast and unambiguous on whatever device the DM actually uses
  mid-session, and that is a real-browser check, not a unit test.
- **The adventure page is the largest single view in the app** — a nested,
  reorderable, inline-editable list. It is the task most likely to need splitting.
- **Empty app, no seed data.** With no import (§3), every screen is built against
  hand-made fixtures until the DM authors real content, so the "50-scene
  adventure" case is easy to leave untested. It is named in §5 for that reason.

**Open questions**

- **Import.** The twenty sheets hold roughly seven hundred authored rows across
  ~60 mapped locations. This spec assumes none of it is imported. If the _content_
  (not the progress) is wanted after all, it is its own spec and its own task,
  including reconciling the `01A`-style map codes against the 42 places already in
  the tree.
- **Does an item's value count toward the currency target?** §6 assumes yes,
  matching the spreadsheet. Cheap to confirm, expensive to discover late.
- **Which device runs the app at the table?** Decides whether the check controls
  are designed for a pointer or a thumb.
- **Currency unit per adventure or per campaign?** Modelled per adventure above,
  because the DM's own campaign switches from silver to gold at level 8.

## 10. Task breakdown

- [ ] **T1** — ADR-0011: nested collections and the metadata layer. _(no test; decision artefact, blocks T4/T8)_
- [ ] **T2** — Schema + migration for the six tables. _(test: migration applies to an empty database; relations null rather than cascade where §6 says so)_
- [ ] **T3** — Definitions: the three closed vocabularies and their interfaces. _(test: vocabulary membership validators)_
- [ ] **T4** — Metadata for `campaign` and `adventure`. _(test: each field declares `fieldType`, `controlType`, `validator`, `getDatum`, as the existing domain metadata tests assert)_
- [ ] **T5** — Data layer: campaign, adventure-with-scenes, and the budget totals. _(test: totals against a fixture with unmarked, awarded and taken rows; unset target is not zero)_
- [ ] **T6** — Server actions: CRUD and reorder, auth-guarded and validated. _(test: unauthenticated rejection and invalid-input rejection for each)_
- [ ] **T7** — Campaign page: creation, ladder, status. _(test: empty state, position ordering)_
- [ ] **T8** — Adventure page: scene list, scene editor, creatures and treasure. _(test: the six kinds render; place link, and unset place state)_
- [ ] **T9** — Budget panel + check-off controls. _(test: independence of awarded and taken; state survives reload)_
- [ ] **T10** — i18n both catalogues, a11y pass, docs update. _(test: catalogue key-set check in CI, axe at zero)_

T7–T9 are the ones most likely to want splitting once T4's shape is known.

## 11. Outcome

_Fill in at close._

- Shipped: —
- Deviations from spec and why: —
- Follow-up debt created: —

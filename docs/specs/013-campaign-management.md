# SPEC-013: Campaign management

- **Status:** **Agreed 2026-08-18.** Amended the same day after the DM's review of the first draft (§6's counting rule reversed, treasure catalogue added, per-scene table renamed), and §7's fork settled by [ADR-0011](../adr/0011-inline-collections-outside-the-metadata-layer.md). **Amended again 2026-08-18** during T2/T3, for three things the document got wrong rather than left open: §6's Prisma block did not validate, §9 named the wrong directory for the mutations, and §3 was missing a non-goal the DM stated. Each is marked below.
- **Date:** 2026-08-18
- **Phase:** ROADMAP Phase 4 (Session tooling)
- **Related:** [`docs/domain/campaign-design-method.md`](../domain/campaign-design-method.md) · [SPEC-004](./004-world-model.md) (world tree) · [SPEC-010](./010-deleting-a-place.md) (place deletion) · [SPEC-011](./011-cross-entity-search.md) · [SPEC-001](./001-combat-tracker.md) (successor, not prerequisite) · SPEC-014 (calendar and timeline — planned, not yet written) · [ADR-0011](../adr/0011-inline-collections-outside-the-metadata-layer.md) (decides §7) · ADR-0009/0010 · ROADMAP Phase 3, "Campaigns as stories, not as scoping"

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
- **Not the calendar, and not a session diary.** Three things keep getting
  confused and are deliberately separated here. The **calendar** — the planned
  sequence of dated events, what the antagonists do while the party does
  something else — is SPEC-014, its own feature. The **diary** — what actually
  happened, written after play — is a third feature, not yet specified. This spec
  gives an adventure one free-text `timeline` field and nothing more: it costs
  almost nothing, it is what the DM does by hand today, and SPEC-014 will
  supersede it. Do not grow it into a calendar here.
- **Not campaign scoping.** No `campaignId` goes on `spells`, `npc`, `deities`,
  `magicitems` or `zone`. The Phase 3 decision stands: a campaign is a storyline
  inside the one universe, not a boundary around every record.
- **Not searchable from the cross-entity search page.** _(Added 2026-08-18, from the DM.)_ Campaigns, adventures, scenes, creatures and loot are never added to
  [SPEC-011](./011-cross-entity-search.md)'s `/dashboard/search`. A campaign is the DM's
  private working material; what the DM shares out of one is its NPCs, magic items and
  deities, and those are already their own domains, searchable there. This costs nothing
  to honour — `app/lib/data/search/searchAllDomains.ts` queries a hand-written list of six
  domains and does not enumerate `PageType`, so a new domain is opt-in. Registering
  `campaign` and `adventure` as `PageType` members does not pull them in; only editing
  that list would. Do not edit it.
- **Not multi-user and not player-facing.** Single DM, single screen, same as the
  rest of the app. No sharing, no player view, no print/PDF export.
- **Not branching.** Adventures are a sequence and scenes are a list. No
  alternate paths, no conditional unlocks.
- **Not a migration of the existing spreadsheet.** The spreadsheet is the source
  of the method, not data to carry over; the app starts empty and the DM authors
  into it. Confirmed with the DM 2026-08-18, with the intent to revisit importing
  the twenty sheets' _content_ **after this ships** — deferred deliberately, not
  dropped. It is its own spec when it comes, and it will have to reconcile the
  `01A`-style map codes against the places already in the tree.

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
   optionally linked to an existing NPC) and **loot** rows (description, quantity,
   value, optionally linked to an existing magic item _or_ to an entry in the new
   treasure catalogue).
6. A budget panel on the adventure shows, for each of experience, currency,
   permanent items and consumables, three figures: **target · assegnato ·
   trovato**, with the two differences named — what is left to place, and what the
   party missed. Which budget a loot row falls into is **derived from what it
   links to**, never asked of the DM again (§6).

**Main flow — running**

7. During a session the DM works down the adventure's scenes. Each scene, each
   creature and each loot row carries a check control. One click — or the keyboard
   alone, since the DM runs the app from a laptop at the table, never a tablet
   (§9) — marks experience awarded (scene, creature) or loot taken; the budget
   panel updates without a page reload.
8. A scene's place, where set, is a link that opens that place's map.

**Edge cases**

| Situation                                                     | Expected behaviour                                                                                                                                                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| No campaign yet                                               | Empty state with a single call to action; no empty ladder, no zero-filled budget panel.                                                                                       |
| Adventure with no scenes                                      | Empty state inviting the first scene; budgets show target and `0` assigned, not blanks.                                                                                       |
| Budget target not set                                         | The row reads `—`, not `0`. An unset target is not a target of zero.                                                                                                          |
| Scene with no place                                           | Renders as "Luogo non assegnato" with a control to pick one — the same treatment SPEC-007 gave unplaced records.                                                              |
| Scene's place is deleted                                      | `scene.zoneId` is set to null, never cascading the scene away. SPEC-010 reparents children; a scene is not a child of a place and must survive it.                            |
| Creature links to an NPC that is deleted                      | Same: the link nulls, the authored name and numbers stay.                                                                                                                     |
| Two adventures at the same target level                       | Allowed. Position, not level, orders the ladder — the DM intends standalone adventures later (§9).                                                                            |
| Reordering scenes / adventures                                | Explicit integer position, editable; not derived from creation order.                                                                                                         |
| Rapid repeat clicks on a check control                        | Idempotent — the control sets a state, it does not toggle a counter.                                                                                                          |
| Very long adventure (50+ scenes)                              | The scene list is the page's main content and paginates nothing; the budget panel stays visible while scrolling.                                                              |
| Loot row linked to nothing, with no value                     | Counts toward no budget. The row is legitimate (a plot item, a letter) and the panel must not silently swallow it — it renders in the scene and is excluded from every total. |
| Loot row linked to both a magic item and a catalogue treasure | Rejected by the validator. At most one link; a mixed haul is two rows, as the DM's own sheet writes it.                                                                       |
| Linked magic item or catalogue treasure is deleted            | The link nulls; the authored description, quantity and value stay. The row then counts as unlinked.                                                                           |
| Adventure's currency unit is changed                          | Nothing is rewritten. Values are stored in silver and rendered in the adventure's unit (§6).                                                                                  |
| Unauthenticated request to any mutation                       | Rejected, as everywhere else.                                                                                                                                                 |

## 6. Data model changes

Six new tables and **one new column on an existing one**. New tables use English
column names — the Italian columns elsewhere are legacy decoupled by `@map`, not
a convention to extend (`CLAUDE.md`, _Language conventions_).

_(The first draft said "six new tables, no change to any existing one" and then
declared five. Both halves were wrong: it is six now that the treasure catalogue
is one of them, and `magicitems` does change — see the counting rule below.)_

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
  currencyTarget      Int? // stored in silver, like every value in this spec
  currencyUnit        String? // silver | gold — DISPLAY only, see the counting rule
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
  loot      loot[]

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

// What a scene gives up. Named `loot`, not `treasure`: `treasure` is now the
// catalogue below, the page the DM browses. A scene has loot; loot points at
// the catalogue.
model loot {
  id      Int   @id @default(autoincrement())
  sceneId Int
  scene   scene @relation(fields: [sceneId], references: [id], onDelete: Cascade)

  position    Int
  description String
  quantity    Int     @default(1)
  value       Int? // in silver; supplies or overrides the catalogue's value
  taken       Boolean @default(false)

  // At most one link, enforced by the validator, never both.
  magicItemId Int?
  magicitem   magicitems? @relation(fields: [magicItemId], references: [id], onDelete: SetNull)
  treasureId  Int?
  treasure    treasure?   @relation(fields: [treasureId], references: [id], onDelete: SetNull)

  @@index([sceneId])
}

// The seventh domain: non-magical valuables. Same shape as `magicitems` — a
// library the DM authors once and draws on from any adventure. Coins, art
// objects, gems, trade goods.
model treasure {
  id          Int      @id @default(autoincrement())
  name        String
  description String?
  category    Int // static options, like magicitems.type
  value       Int? // in silver
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  loot loot[]

  @@index([name])
}
```

**The one change to an existing table:**

```prisma
model magicitems {
  // …unchanged…
  consumable Boolean @default(false) // NEW
}
```

**Three back-relations on existing models, which the block above omits:**

```prisma
model magicitems {
  loot loot[]           // NEW — opposite side of loot.magicitem
}

model npc {
  sceneCreatures sceneCreature[]  // NEW — opposite side of sceneCreature.npc
}

model zone {
  scenes scene[]        // NEW — opposite side of scene.zone
}
```

Prisma requires the opposite side of every relation, so without these `prisma validate`
fails outright. `zone` already carries `npc`, `deities` and `poi` back-relations, so a
fourth is unambiguous and needs no named relation.

_(Corrected 2026-08-18 during T2. The first version of this section declared
`treasures treasure[]` on `scene` — a leftover from the rename this same section
describes, since `treasure` is the catalogue and has no `sceneId`. A scene's rows are
`loot`. That line plus these three omissions meant the block as published did not
validate; it does now.)_

`magicitems.type` already distinguishes scroll and potion from the other seven
types — `6` and `7` respectively, per `app/lib/config/magicitem/item-types.ts`, against
the Postgres column `tipo` — and that is _nearly_ the same thing — but only nearly: a wand with charges
is permanent, and a wondrous item can be single-use. Deriving the answer from
`type` would be wrong on real items, so it is its own field. Backfill: `true` for
scroll and potion, `false` for the rest, which the DM then corrects by hand where
the derivation guessed wrong.

- **Backfill needed?** Only for `magicitems.consumable`, from `type`, as above.
  Every new table starts empty.
- **Reversible?** Yes — dropping the six tables and the one column restores the
  previous schema exactly. Every new foreign key is nullable and lives on the
  _new_ side of its relation.
- **`campaignId` is nullable from the start.** Not speculation: the DM has stated
  the intent to author standalone adventures (five at level 6, played in any
  order) alongside campaigns. A nullable column now costs nothing; adding one to a
  populated table later costs a migration and a backfill.
- **Derived, never stored:** every total in the budget panel — assigned and found
  experience, currency, permanent and consumable counts, and the hero-point
  count. Storing them is what let the spreadsheet drift.

### The counting rule

The first draft got this backwards and said so as an assumption to confirm. It is
now settled, from the DM's own sheet rather than by asking:

| Row in the spreadsheet                                 | Argento | Ogg | Poz |
| ------------------------------------------------------ | ------- | --- | --- |
| Pendaglio di Giada della Mano Nera 8mo                 | 80      | —   | —   |
| Ghiandole di ragno gigante 4mo                         | 40      | —   | —   |
| Polvere di Strega\* x 1                                | —       | —   | 1   |
| Arma di qualità eccezionale\* x 2 · Nettare Elfico x 4 | —       | 2   | 4   |
| Mezza Armatura Barbarica\* · 1 Tharun d'argento        | 20      | 1   | —   |

The asterisk marks a magic item, and the pattern holds across every row: **a
magic item counts toward the permanent or consumable target and its worth does
_not_ enter the currency total; a non-magical valuable counts toward the currency
total and nothing else.** In the last row the 20 is the coin, not the armour.

The three budgets are therefore **three disjoint inventories**, not three views of
one number — which is exactly why the treasure catalogue is structurally
necessary rather than a convenience. So:

- **currency** = Σ `value × quantity` over loot rows **not** linked to a magic item;
- **permanent items** = Σ `quantity` over loot rows linked to a magic item with
  `consumable = false`;
- **consumables** = Σ `quantity` over loot rows linked to a magic item with
  `consumable = true`.

A loot row's budget is thus **derived from its link**, never a classification the
DM re-enters per row. A mixed haul — an enchanted armour and a silver coin found
together — is two rows, which is how the sheet already writes it.

### Currency: one stored unit, two displayed

The DM reasons in **silver** through the early levels, where the campaign is poor
and silver is the people's coin, and switches to **gold** from level 8. That is a
deliberate texture of the setting and worth keeping; it is also not a modelling
problem, because the two are not different scales of measurement, only different
labels on one.

**Every monetary value in this spec is stored as an integer number of silver** —
`loot.value`, `treasure.value`, `adventure.currencyTarget`. `adventure.currencyUnit`
is a **display** choice (`silver` | `gold`, 1 gold = 10 silver, in both the system
this campaign came from and the one the app targets). Amounts are entered and
rendered in the adventure's unit and converted at the render boundary; changing an
adventure's unit rewrites nothing.

This costs one conversion helper and its test, and buys three things: the
campaign keeps its flavour, totals across adventures of different eras are
comparable, and an amount typed at level 9 cannot silently be a hundredth of what
was meant.

## 7. Metadata changes

`campaign`, `adventure` and the new `treasure` catalogue are ordinary flat
entities and fit the metadata layer as it stands. The catalogue in particular is
the seventh domain and looks exactly like the six that exist — a list, a form,
filters — with `category` an option-backed integer field, the same shape
`magicitems.type` already has. So is the new `magicitems.consumable`: one boolean
`PageMeta` alongside the existing ones. For all of these: a `PageMeta` per field in `app/lib/config/campaigns/`, composed into
`pageMetaFields.ts` and ordered in `pagesConfig.ts`, driving form, list and
validation exactly as the other six domains do.

`scene`, `sceneCreature` and `loot` do not. They are **ordered collections edited
inline inside a parent's page** — a shape `EntityForm` has never had to render,
since every existing domain is one flat record per form.

**`campaign` and `adventure` don't either — corrected 2026-08-19.** The
paragraph above originally claimed campaign/adventure "fit the metadata layer
as it stands... driving form, list and validation exactly as the other six
domains do," i.e. a standard `EntityList`/header-filter page. §5 always
described something else: a single campaign, created once via an empty-state
form, with adventures shown as a position-ordered ladder — not a filterable
admin list. The two readings were never reconciled at the time (see the "Still
open" note this replaces, below), and [ADR-0011](../adr/0011-inline-collections-outside-the-metadata-layer.md)
itself had the same error, naming them "inside" the metadata layer. Asked
directly ahead of T4, the DM confirmed §5's ladder reading. `campaign` and
`adventure` join `scene`/`sceneCreature`/`loot` outside the metadata layer:
dedicated components under `app/ui/campaigns/`, no list page, no
`pagesConfig.ts`/`queryFields.ts`/`listConfig.ts` registration. `getQuery.ts`'s
hardcoded `name`-default-sort-field is therefore never reached by
`title`-keyed campaign/adventure rows — the fix that reading would have
required does not apply.

The treasure catalogue is the one that actually fits the description above: a
flat record, its own list page, its own filters — shipped as T4b.

They stay outside the metadata layer, as dedicated components under
`app/ui/campaigns/`, and `PageMeta` gains no collection variant. Every scalar
field on those rows still declares its `PageMeta` — validator and label key
included — and the editor consumes those declarations rather than restating them.

The ADR carries the reasoning, the alternative it rejected (a fifth `PageMeta`
variant, which three of the layer's four consumers would have to special-case as
inapplicable — the unenforced state TD-08 removed), the boundary between the two
regimes, and the condition that reopens it. Do not re-argue it here; if it needs
reopening, that happens in a new ADR.

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
- [ ] Creatures and loot can be added to a scene, and the creature's XP total is
      `xpEach × quantity`.
- [ ] A treasure catalogue entry can be created, listed, filtered and linked from
      a loot row, like any other domain.
- [ ] A magic item declares whether it is consumable, and the backfill set scroll
      and potion to consumable and everything else to permanent.
- [ ] A loot row linked to a magic item counts toward the permanent or consumable
      target and **not** toward the currency total; a loot row not linked to one
      counts toward the currency total and nothing else.
- [ ] A loot row rejects being linked to a magic item and a catalogue treasure at
      once.
- [ ] An amount entered while the adventure displays gold is stored as ten times
      that many silver, and changing the adventure's unit rewrites no stored value.
- [ ] The budget panel shows target, assigned and found for experience, currency,
      permanent items and consumables, and an unset target renders as `—`.
- [ ] Marking a scene, creature or loot row updates the budget panel without a
      full page reload, and the state survives a reload.
- [ ] Every check control can be operated from the keyboard alone, without a
      pointer.
- [ ] Assigned and found are independent: marking a fight awarded does not mark
      its loot taken.
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

| #   | File                                                                                                                                                                                | Change                                                                                                                                                                                                                                                                          |
| --- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | ~~`docs/adr/0011-inline-collections-outside-the-metadata-layer.md`~~                                                                                                                | ✅ written 2026-08-18 — decides §7                                                                                                                                                                                                                                              |
| 2   | `prisma/schema.prisma` + migration                                                                                                                                                  | The six tables, plus `magicitems.consumable` and its backfill                                                                                                                                                                                                                   |
| 3   | `app/lib/definitions/**`                                                                                                                                                            | `SceneKind`, `AdventureStatus`, `TreasureCategory`, interfaces                                                                                                                                                                                                                  |
| 4   | `app/lib/config/campaigns/**`; `app/lib/config/magicitem/**`, `pageMetaFields.ts`, `pagesConfig.ts`, `queryFields.ts`, `listConfig.ts`, `formFields.ts` for `magicitems.consumable` | `campaign`/`adventure` `PageMeta` (bespoke, per ADR-0011's amendment — not registered in `pagesConfig.ts`/`queryFields.ts`/`listConfig.ts`); `magicitems.consumable` fully wired as a standard field, same as `attuned`. The treasure catalogue (also standard) shipped as T4b. |
| 5   | `app/lib/data/campaigns/**`                                                                                                                                                         | One function per file: fetch campaign, adventure with scenes, budget totals                                                                                                                                                                                                     |
| 6   | `app/lib/data/campaigns/**`                                                                                                                                                         | Create/update/delete/reorder + the check-off toggles, each auth-guarded and Zod-validated                                                                                                                                                                                       |
| 7   | `app/[locale]/dashboard/campaign/**`                                                                                                                                                | Campaign page, adventure page                                                                                                                                                                                                                                                   |
| 8   | `app/ui/campaigns/**`                                                                                                                                                               | Ladder, scene list, scene editor, budget panel, check controls                                                                                                                                                                                                                  |
| 9   | `messages/{it,en}.json`                                                                                                                                                             | Both catalogues, same key set                                                                                                                                                                                                                                                   |
| 10  | `docs/PROJECT_STATE.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md`                                                                                                                  | Inventory, Phase 4, and the metadata-layer boundary the ADR sets                                                                                                                                                                                                                |

**Risks**

- **~~The ADR is on the critical path.~~** Closed by ADR-0011. The residual risk it
  names is that the app now has two ways to build an editing surface, and the
  boundary only works if the next session reads it — hence the follow-up to
  `CLAUDE.md` and `ARCHITECTURE.md` the ADR calls for.
- **The at-the-table interaction is the part tests will not catch.** Marking has
  to be fast and unambiguous mid-session on a laptop — pointer or keyboard, never
  touch — and that is a real-browser check, not a unit test.
- **The adventure page is the largest single view in the app** — a nested,
  reorderable, inline-editable list. It is the task most likely to need splitting.
- **Empty app, no seed data.** With no import (§3), every screen is built against
  hand-made fixtures until the DM authors real content, so the "50-scene
  adventure" case is easy to leave untested. It is named in §5 for that reason.

**Answered since the first draft** _(2026-08-18, kept rather than deleted — the
reasoning is the useful part)_

- **Import** — deferred to after this ships, not dropped. See §3.
- **Does an item's value count toward the currency target?** No, and the first
  draft assumed the opposite. Settled from the spreadsheet itself; see §6's
  counting rule for the evidence.
- **Which device runs the app at the table?** A laptop, Windows or Mac. Never a
  tablet. So the check controls are designed for pointer and keyboard, and
  keyboard operation is an acceptance criterion rather than an accessibility
  afterthought.
- **Currency unit per adventure or per campaign?** Per adventure, and the DM's
  reason for it — silver is the people's coin while the campaign is poor, gold
  from level 8 — is worth keeping. Resolved by storing one unit and displaying
  two; see §6.

**Still open**

Nothing, as of 2026-08-19. The one open item — whether `campaign`/`adventure`
get a standard filterable list page or the bespoke ladder — is resolved above
and in [ADR-0011](../adr/0011-inline-collections-outside-the-metadata-layer.md)'s
2026-08-19 amendment: the ladder reading, confirmed by the DM. `getQuery.ts`'s
hardcoded `name`-default-sort-field is consequently out of scope for this
spec — `campaign`/`adventure` never reach `getQuery.ts` at all.

§7's original fork was the prior open item and
[ADR-0011](../adr/0011-inline-collections-outside-the-metadata-layer.md)
closed it on 2026-08-18 — incompletely, as it turned out; see the ADR's own
amendment note.

## 10. Task breakdown

- [x] **T1** — ADR-0011: ordered inline collections outside the metadata layer. **Done 2026-08-18.** _(no test; decision artefact, blocked T4/T8)_
- [x] **T2** — Schema + migration: the six tables, `magicitems.consumable`, and its backfill from `type`. **Done 2026-08-18** ([PR #181](https://github.com/pastorello/nextjs-campaign-settings/pull/181)). _(test: migration applies to an empty database; relations null rather than cascade where §6 says so; the backfill sets scroll and potion consumable and nothing else)_
- [x] **T3** — Definitions: the three closed vocabularies and their interfaces. **Done 2026-08-18** ([PR #180](https://github.com/pastorello/nextjs-campaign-settings/pull/180)). _(test: vocabulary membership validators)_
- [x] **T4** — Metadata for `campaign`, `adventure` and `magicitems.consumable`. **Done 2026-08-19** ([PR #193](https://github.com/pastorello/nextjs-campaign-settings/pull/193)). `campaign`/`adventure` landed bespoke (ADR-0011 amendment), not registered in `pagesConfig.ts`; `magicitems.consumable` landed as a standard field, fully wired like `attuned`. _(test: each field declares `fieldType`, `controlType`, `validator`, `getDatum`, as the existing domain metadata tests assert)_
- [x] **T4b** — The treasure catalogue as the seventh domain: metadata, list, form, filters. **Done 2026-08-18** ([PR #185](https://github.com/pastorello/nextjs-campaign-settings/pull/185)). _(test: the same suite shape the other six domains have — CRUD, validation, unauthenticated rejection)_
- [x] **T5** — Data layer: campaign, adventure-with-scenes, the budget totals and the silver/gold conversion. **Done 2026-08-19.** `fetchCampaign`/`fetchAdventureWithScenes` are plain `select`-and-map reads (ADR-0011 — no `getQuery`/`buildResultSchema`, which `campaign`/`adventure` never register for); `getBudgetTotals` recomputes all four budgets plus the hero-point count from the scene tree on every read, per §6's "derived, never stored". _(test: the three disjoint inventories against a fixture mixing magic, catalogue and unlinked loot; unset target is not zero; a gold-displayed amount round-trips)_
- [x] **T6** — Server actions: CRUD and reorder, auth-guarded and validated. **Done 2026-08-19.** `campaign` gets create/update only — no delete (its `adventure` FK is `onDelete: Restrict` and §5 names no flow for removing the campaign itself) and no reorder (a single record has no ladder of its own). `adventure`/`scene`/`sceneCreature`/`loot` each get create/update/delete/reorder; `scene`/`sceneCreature`/`loot` also get an idempotent `set*Awarded`/`setLootTaken` check-off action. `sceneMeta.ts`/`sceneCreatureMeta.ts`/`lootMeta.ts` (validator + label key per field, per ADR-0011) shipped as part of this task rather than before it. `loot`'s magic-item/treasure mutual exclusion is a `.refine()` on the built schema, not either field's own validator. `buildBespokeEntitySchema.ts` is `buildEntitySchema.ts`'s pair for these five domains, which never register in `pagesConfig.ts`. `zoneId`/`npcId`/`magicItemId`/`treasureId` widened `PageMeta`'s `OptionTableName` from its one-member `"faction"` union to include `"zone"`/`"npc"`/`"magicitems"`/`"treasure"`, with `fetchFieldOptions.ts` gaining the matching cases — the same table-backed-FK shape `npc.faction` already established (SPEC-006 §7), not a new mechanism. _(test: unauthenticated rejection and invalid-input rejection for each, plus the loot mutual-exclusion and check-off idempotency edge cases)_
- [x] **T7** — Campaign page: creation, ladder, status. **Done 2026-08-19.** `app/[locale]/dashboard/campaign/page.tsx`, the "root exists?" shape `world/page.tsx` already uses for SPEC-004's single root. `CampaignForm`/`AdventureForm`/`AdventureLadder`/`CampaignHeader` under `app/ui/campaigns/` are hand-rolled, not `EntityForm` — `usePageManager`/`InputComponent` resolve fields through `PageType`, which `campaign`/`adventure` never register for (ADR-0011). Reordering is two buttons per row, not drag-and-drop, per §9's laptop-only interaction note. `BespokeFormErrorSummary` (`app/ui/forms/`) is `FormErrorSummary`'s pair for these domains — `FormErrorSummary` resolves a field's label through the global `fieldMeta` registry, which silently returns a _different_ domain's label for a same-named field (`title` collided with `npc.fields.title.label` in testing) since `campaign`/`adventure` never join it. `fetchAdventureSceneProgress` (T7, not T5) is the ladder's "progress readout" — a separate grouped query, not a `fetchCampaign` change, since that read's own test suite already asserts an exact shape. Found and fixed in the browser, not by a test: `adventureMeta.synopsis`/`timeline`/`currencyUnit` validated `string | undefined` (`.optional()`) but `Adventure`'s domain interface types them `string | null`, so `AdventureForm`'s minimal create (§5.2: position/level/title only) failed validation on the other three being `null`. Fixed with the same `z.preprocess` shape `nullableAmountValidator` already used, regression-tested in `adventureMeta.test.ts`. _(test: empty state, position ordering)_
- [x] **T8** — Adventure page: scene list, scene editor, creatures and loot. **Done 2026-08-19** ([PR #197](https://github.com/pastorello/nextjs-campaign-settings/pull/197)). `app/[locale]/dashboard/campaign/[adventureId]/page.tsx`, the same "root exists?"/`notFound()` shape as the rest of the dashboard's dynamic routes. `AdventureHeader`/`AdventureInfoForm` (`app/ui/campaigns/`) edit the adventure's own fields the ladder-level `AdventureForm` deliberately leaves out (synopsis, timeline, the four budget targets); `SceneList`/`SceneForm`, `SceneCreatureList`/`SceneCreatureForm` and `LootList`/`LootForm` are the three nested ordered collections, hand-rolled per ADR-0011, each field's validator and label key still coming from `sceneMeta`/`sceneCreatureMeta`/`lootMeta` (T6). Reordering is up/down buttons, per §9's laptop-only note, same as `AdventureLadder`. `AdventureLadder`'s row title now links to the adventure page (previously unreachable). `currencyTarget`/loot `value` are entered and displayed in the adventure's `currencyUnit` and converted at the submit/render boundary via `convertCurrency.ts` (T5); switching the unit mid-edit re-derives the displayed target through stored silver as the pivot, so the stored value survives unchanged — found and fixed in the browser (a naive first cut silently multiplied the stored target by 10 on a unit switch), regression-tested in `AdventureInfoForm.test.tsx`. `awarded`/`taken` are deliberately not surfaced here — the check-off control is T9's. _(test: the six kinds render; place link, and unset place state; a loot row rejects two links)._ Also found and fixed in the browser: `sceneMeta.description`/`sceneCreatureMeta.note` validated `string | undefined` (`.optional()`) but `Scene`/`SceneCreature`'s domain interfaces type them `string | null`, the same gap T7 found and fixed for `adventureMeta.synopsis`/`timeline` — fixed with the same `z.preprocess` shape, regression-tested in `sceneMeta.test.ts`/`sceneCreatureMeta.test.ts`.
- [x] **T9** — Budget panel + check-off controls. **Done 2026-08-19.** `BudgetPanel.tsx` (`app/ui/campaigns/`) is a server component reading `getBudgetTotals` (T5) fresh on every render — for each of the four budgets it shows target · assigned · found plus the two named differences §5.6 asks for (left to place, missed), an unset target rendering "—" per the edge case. `CheckOffControl.tsx` wraps the generic `CheckboxInput` (`app/ui/forms/inputs/`, HeadlessUI's `Checkbox`, keyboard-operable — Space toggles it — with no changes needed) with `setSceneAwarded`/`setSceneCreatureAwarded`/`setLootTaken` (T6, already idempotent) and `router.refresh()`; wired into `SceneList.tsx`/`SceneCreatureList.tsx`/`LootList.tsx` per row. The control is purely driven by its `checked` prop — no local state — so a `router.refresh()` (soft) and a full reload (verified in the browser against real adventure data) show the same thing. _(test: `CheckOffControl.test.tsx` proves keyboard operation and that the control reflects props rather than internal state, which is what makes "survives a reload" true; `SceneList.test.tsx`/`SceneCreatureList.test.tsx` assert two rows toggle independently; `BudgetPanel.test.tsx` covers the unset-target "—", the target/assigned/found figures and the currency unit conversion)_
- [ ] **T10** — i18n both catalogues, a11y pass, docs update. _(test: catalogue key-set check in CI, axe at zero)_

T7–T9 are the ones most likely to want splitting once T4's shape is known. T4b is
independent of the fork in §7 and could ship first — it is an ordinary domain,
and it is the one piece the DM can start filling with real content immediately.

## 11. Outcome

_Fill in at close._

- Shipped: —
- Deviations from spec and why: —
- Follow-up debt created: —

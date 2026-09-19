# SPEC-021: Daggerheart — domains, domain cards, classes and subclasses

- **Status:** Agreed 2026-09-19 — written from an interview with the DM the same day, read through and agreed without changes. The slice spec for [SPEC-018](./018-game-systems.md) T4.
- **Date:** 2026-09-19
- **Phase:** 4
- **Related:** [SPEC-018](./018-game-systems.md) (§5 licence constraints and §6 catalogue structure — binding here) · [ADR-0013](../adr/0013-game-systems.md) · [`daggerheart.md`](../domain/daggerheart.md) · [`licensing.md`](../domain/licensing.md) · [SPEC-019](./019-formatted-text.md) (formatted feature text — a prerequisite) · [SPEC-020](./020-record-images.md) (domain emblems — a prerequisite) · [ADR-0011](../adr/0011-inline-collections-outside-the-metadata-layer.md) (ordered features)

---

## 1. Problem

The DM wants to play the setting under Daggerheart and to author original
Daggerheart-compatible material. The app has the system dimension (SPEC-018 T2,
T3) but no Daggerheart catalogue: nowhere to write a domain, a domain card, a
class or a subclass, or to see which cards a class can pick.

## 2. Goal

Under the `daggerheart` system, the DM can author domains, domain cards, classes
and subclasses, see a card as a card, and open a class to find its features,
its subclasses and every card of its two domains by level.

## 3. Non-goals

- **Any rules content in the repository** (SPEC-018 §5, DPCGL 2.0): nothing is
  seeded; tests and fixtures use invented names and text only.
- **Characters** (class, level, chosen cards) — a later spec (decided 2026-09-19).
- **Printing cards.** The card view is on screen only (decided 2026-09-19).
- **Import.** Everything is entered in forms (decided 2026-09-19).
- **Ancestries, communities, adversaries, environments, equipment** — SPEC-018
  T5–T7.
- **"Daggerheart" in the app's or repository's title** (SPEC-018 §5.3).

## 4. User stories

- As a DM, I want to write a domain with its colour and emblem, and cards in it,
  so that my homebrew domains exist next to the ones I copy for private play.
- As a DM, I want to see a domain card laid out like a card, so that I can check
  how it reads.
- As a DM, I want a class page showing its features, its subclasses with their
  foundation, specialization and mastery features, and the cards of its two
  domains by level.

## 5. Behaviour

**Main flow**

1. `daggerheart` joins `GAME_SYSTEMS`, so the system switch (SPEC-018 T2 part C)
   becomes active. Under `/dashboard/daggerheart/…` the 5e catalogues are not
   found, the world pages are unchanged, and the sidebar lists the Daggerheart
   catalogues below.
2. **Domains** — list, form, detail. Fields: name, description (formatted,
   SPEC-019), colour (picked from a palette of accessible colours), emblem
   (SPEC-020), origin (`homebrew` | `srdReference`, default homebrew). A domain's
   page lists its cards by level.
3. **Domain cards** — list with header filters (domain, level, type, origin),
   form, and a **card view**: a card-shaped panel with the domain's colour and
   emblem, the name, level, recall cost, type and the formatted feature text. The
   list can switch between rows and a grid of card views. Fields: name, domain,
   level 1–10, recall cost (Stress, ≥ 0), type (ability / spell / grimoire),
   feature text (formatted), origin.
4. **Classes** — list, form, page. Fields: name, description, two different
   domains, starting Evasion, starting HP, class items (formatted), Hope feature
   (name + formatted text; its cost is always 3 Hope and is not stored), class
   features (ordered, at least one, each name + formatted text; edited inline per
   ADR-0011), origin. The **class page** shows the class, then its subclasses with
   their features grouped foundation / specialization / mastery, then the cards of
   its two domains grouped by level (card views).
5. **Subclasses** — list with a class filter, form, and shown on their class's
   page. Fields: class, name, description, spellcast trait (none, or one of
   Agility, Strength, Finesse, Instinct, Presence, Knowledge), features (ordered,
   each tagged foundation / specialization / mastery, name + formatted text),
   origin.
6. Cross-entity search (SPEC-011, filtered by system since SPEC-018 T2 part C)
   includes domains, domain cards, classes and subclasses under `daggerheart`.
7. Pages show the descriptive line "Daggerheart™ Compatible" where the system is
   named (SPEC-018 §5.3); the system's label elsewhere stays as ADR-0013 set it.

**Edge cases**

| Situation                                   | Expected behaviour                                                       |
| ------------------------------------------- | ------------------------------------------------------------------------ |
| A class given the same domain twice         | Field error on the second domain (SPEC-018 §5)                           |
| Deleting a domain that cards or classes use | Refused with a field error naming how many use it (`onDelete: Restrict`) |
| Deleting a class that has subclasses        | Refused the same way; delete or move the subclasses first                |
| A class with no features                    | Field error: at least one                                                |
| Level outside 1–10, negative recall cost    | Field errors                                                             |
| A Daggerheart page under `dnd5e`            | Not found, as a 5e catalogue under `daggerheart` is                      |
| Empty catalogue                             | The standard empty state; nothing is seeded                              |

## 6. Data model changes

Table names carry a `dh` prefix so the 5e catalogues keep theirs (SPEC-018 §6:
one table per system and domain).

```prisma
// proposed
model dhDomain {
  id          Int     @id @default(autoincrement())
  name        String
  description String?
  colour      String  // a palette key, not free hex
  imageId     Int?    @unique // SPEC-020
  origin      String  @default("homebrew")
  cards       dhDomainCard[]
  // + createdAt / updatedAt, and the two class relations below
}

model dhDomainCard {
  id          Int     @id @default(autoincrement())
  name        String
  domainId    Int
  domain      dhDomain @relation(fields: [domainId], references: [id], onDelete: Restrict)
  level       Int     // 1–10, CHECK
  recallCost  Int     // ≥ 0, CHECK
  type        String  // ability | spell | grimoire
  featureText String
  origin      String  @default("homebrew")
  @@index([domainId, level])
}

model dhClass {
  id              Int     @id @default(autoincrement())
  name            String
  description     String?
  domainAId       Int     // Restrict; CHECK domainAId <> domainBId
  domainBId       Int
  startingEvasion Int
  startingHp      Int
  classItems      String?
  hopeFeatureName String
  hopeFeatureText String
  origin          String  @default("homebrew")
  features        dhClassFeature[]
  subclasses      dhSubclass[]
}

model dhClassFeature {        // ordered, inline (ADR-0011)
  id       Int    @id @default(autoincrement())
  classId  Int    // Cascade
  position Int
  name     String
  text     String
}

model dhSubclass {
  id             Int     @id @default(autoincrement())
  classId        Int     // Restrict
  name           String
  description    String?
  spellcastTrait String? // agility | strength | finesse | instinct | presence | knowledge
  origin         String  @default("homebrew")
  features       dhSubclassFeature[]
}

model dhSubclassFeature {     // ordered within its tier, inline (ADR-0011)
  id         Int    @id @default(autoincrement())
  subclassId Int    // Cascade
  tier       String // foundation | specialization | mastery
  position   Int
  name       String
  text       String
}
```

- **Features are one table per owner, not one polymorphic `feature` table**
  (SPEC-018 §9 open question 1, decided here): each owner keeps a real foreign
  key and cascade, and the two owners' features differ (tiers exist only on
  subclasses). ADR-0018, written in T1, records it.
- Migration additive; no backfill; nothing seeded. Reversible by dropping the new
  tables.

## 7. Metadata changes

Four new domains in the metadata layer under `app/lib/config/daggerheart/`
(`dhDomainMeta`, `dhDomainCardMeta`, `dhClassMeta`, `dhSubclassMeta`), each page
declaring `system: "daggerheart"` in `pagesConfig` (ADR-0013). Feature lists are
bespoke inline editors per ADR-0011, their scalar fields declared as `PageMeta`.
Formatted fields use SPEC-019's `ControlType.RichText`; the emblem uses SPEC-020's
`ControlType.Image`; the domain colour is a new palette select.

## 8. Acceptance criteria

- [ ] `daggerheart` is a system; its pages exist only under it and the 5e catalogues are not found under it
- [ ] Domains, domain cards, classes and subclasses can be created, edited, listed with filters and deleted
- [ ] The class page shows features, subclasses by tier, and both domains' cards by level
- [ ] The card view shows colour, emblem, name, level, recall cost, type and formatted text
- [ ] A class with the same domain twice, or with no features, is rejected
- [ ] Deleting a used domain or a class with subclasses is refused
- [ ] Search under `daggerheart` finds the four catalogues; under `dnd5e` it does not
- [ ] No seed, fixture or test reproduces SRD content (checked in review)
- [ ] Neither the app's title nor the repository's contains "Daggerheart"
- [ ] New UI copy lands in both `messages/it.json` and `messages/en.json`
- [ ] Every new mutation rejects an unauthenticated request
- [ ] Every new mutation rejects invalid input with field-level errors
- [ ] Coverage has not dropped

## 9. Implementation plan

**Depends on** SPEC-019 (formatted text) and SPEC-020 (images), built first
(agreed 2026-09-19).

**Risks**

- **The first second-system catalogue** exercises ADR-0013's page classification,
  switch and search filtering for real; expect small fixes there.
- **Licence drift** (SPEC-018 §9): re-read `licensing.md` before merging.

**Decided on 2026-09-19**

1. Forms only, no import. 2. Card view on screen, no printing. 3. Class page
   shows subclasses and both domains' cards. 4. No characters. 5. Domains carry a
   colour and an emblem. 6. Feature text is formatted (SPEC-019).

**Open questions**

1. None blocking.

## 10. Task breakdown

- [x] **T1** — ADR-0018 (features per owner). `daggerheart` in `GAME_SYSTEMS`; the sidebar section; schema and additive migration. _(test: page classification; migration)_
  - _Done 2026-09-19._ [ADR-0018](../adr/0018-daggerheart-features-one-table-per-owner.md). Migration `*_spec021_daggerheart_schema`: the six §6 tables, `migrate diff` output plus three hand-written CHECKs (level 1–10, recall cost ≥ 0, distinct domains); features have no timestamps, like `sceneCreature`. `origin`, card `type`, feature `tier` and `spellcastTrait` are enums in `app/lib/definitions/enums/daggerheart/`; the colour palette's keys are left to T2, with its accessible colours. `dhDomain.imageId` is a column only, but `checkRecordImageReference` already asks `dhDomain` — the unique index is per table, so that lookup is the only guard against two owner tables sharing an image. T2 adds the domain to `RecordImageOwner`'s callers and `ownerImageLifecycle.test.ts`. The switch is live (its one-system hint removed) and shows "Daggerheart™ Compatible" under `daggerheart`. **The sidebar section has no entries yet:** every one would 404 until its page exists, so each of T2–T5 adds its entry, with a `page`, to `nav-links.tsx`; what T1 shipped is the filter (`isPageInSystem`) that already hides the 5e catalogues from the sidebar and the overview cards under `daggerheart`.
- [x] **T2** — Domains: meta, actions, list/form/detail with colour and emblem. _(test: actions; delete refused when used)_
  - _Done 2026-09-19._ `PageType.DhDomain` (`/domains`, `/admin/domains`, `DELETE /api/domains/[id]`), metas in `app/lib/config/daggerheart/`. `origin` is one shared `pageMetaFields` field (`dhOriginMeta`), like `imageId`, for every Daggerheart catalogue. The colour is a `DhDomainColour` key; `dhDomainColours.ts` maps each to a `700`/`800` band with white text (≥ 4.5:1, table in the file). The emblem is the shared image field, wired into `ownerImageLifecycle.test.ts`. Delete counts cards and classes (either slot) first and throws a `ConflictError` carrying the `dhDomainInUse` key with both counts; `toErrorResponse` sends it as `refusal` and `DeleteButton` shows it translated. The domain page (`/domains/[id]`) shows its cards by level as card views (`DhDomainCardsByLevel`, reusable by T6).
- [x] **T3** — Domain cards: meta, actions, list with filters, the card view and the rows/cards switch. _(test: filters; card view render)_
  - _Done 2026-09-19._ `PageType.DhDomainCard` (`/domain-cards`, `/admin/domain-cards`). **The card's `level`/`type` columns are `cardLevel`/`cardType` in code** (Prisma `@map`, no migration): the metadata layer's keys are one namespace and spells' `level` and magic items' `type` hold those names. The domain is a table-backed select (`optionTable: "dhDomain"`); the admin list's header filters are domain, level, type and origin. `DhDomainCardView` is an `article` named by its heading, with the domain named in text on its colour band. The public list switches rows/cards with `?view=cards` (rows default). E2E: `e2e/daggerheart-domains.spec.ts`, invented content, cleanup in `finally`.
- [x] **T4** — Classes with inline ordered features and the Hope feature. _(test: distinct domains; ≥1 feature; reorder)_
  - _Done 2026-09-19._ `PageType.DhClass` (`classes`), `dhClassMeta` in `app/lib/config/daggerheart/`, actions in `app/lib/data/dhClasses/`, admin list and new page under `admin/classes`, `DELETE /api/classes/[id]`, sidebar entry. `origin` reuses T2's shared `dhOriginMeta`. **At least one feature:** `createDhClass` takes the first feature beside the class's fields (`firstFeatureName`/`firstFeatureText`) and creates both in one write; `deleteDhClassFeatureById` refuses the last (`classNeedsFeature`). Chosen over validating at save because a feature has no save of its own before its class exists. Features are edited inline in the list's **edit dialog** (ADR-0011, like `LootList`), reordered through `validateAndReorder`; there is no separate class edit page. Equal domains: `domainsMustDiffer` on `domainBId`, checked on update against the stored other domain; the CHECK stays. Delete while subclasses exist: T2's keyed `ConflictError` refusal (`classHasSubclasses`, with the count). "3 Hope" is copy only. Generic changes: `EntityList` derives its option bundle from the page's `optionTable` fields (was a per-page ternary), and a table-backed field may declare `noneOptionKey` — the select's empty entry said "No faction" for every table, the domain card's `domainId` included, which now names a domain. **The sidebar tile links to the admin list** (`href: "/admin/classes"`) until T6 gives classes a page. E2E: `e2e/daggerheart-classes.spec.ts` (two domains through T2's admin, a class, a feature added and reordered inline, a subclass, the refused then allowed deletes).
- [x] **T5** — Subclasses with tiered inline features. _(test: tiers; spellcast trait)_
  - _Done 2026-09-19._ `PageType.DhSubclass` (`subclasses`), `dhSubclassMeta`, actions in `app/lib/data/dhSubclasses/`, admin list with the **class filter as the class column's header filter** (`queryFields`: `classId`, `origin`). `spellcastTrait` is `"none"` in the form and metadata (a string validator cannot output `null`) and `null` in the column: `toStoredSpellcastTrait` maps it on write, the result schema's `defaultValue` maps it back; not filtrable for that reason. Tiered features are edited inline in the edit dialog, grouped by `groupFeaturesByTier` (reusable by T6), reordered **within a tier**; a feature moved to another tier goes to that tier's end. A subclass may have no features. Deleting a subclass cascades its features.
- [ ] **T6** — The class page composition. _(test: subclasses by tier; cards by level)_
- [ ] **T7** — Search includes the four catalogues under `daggerheart`. _(test: system filter)_
- [ ] **T8** — i18n, a11y, e2e: author a domain, a card, a class with a subclass; see the class page. _(test: e2e, invented content only)_

## 11. Outcome

_Fill in at close._

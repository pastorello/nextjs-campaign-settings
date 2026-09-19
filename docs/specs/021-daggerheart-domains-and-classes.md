# SPEC-021: Daggerheart — domains, domain cards, classes and subclasses

- **Status:** Shipped 2026-09-19 (agreed the same day — written from an interview with the DM, read through and agreed without changes). The slice spec for [SPEC-018](./018-game-systems.md) T4. See §11.
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

- [x] `daggerheart` is a system; its pages exist only under it and the 5e catalogues are not found under it _(`pagesConfig.test.ts`; every Daggerheart layout, public and admin, in `daggerheartPages.test.tsx` / `daggerheartAdminPages.test.tsx`)_
- [x] Domains, domain cards, classes and subclasses can be created, edited, listed with filters and deleted _(the `app/lib/data/dh*/` action tests; `e2e/daggerheart-domains.spec.ts`, `daggerheart-classes.spec.ts`)_
- [x] The class page shows features, subclasses by tier, and both domains' cards by level _(`DhClassPageView.test.tsx`, `fetchDhClassPage.test.ts`; `e2e/daggerheart-class-page.spec.ts`)_
- [x] The card view shows colour, emblem, name, level, recall cost, type and formatted text _(`DhDomainCardView.test.tsx`)_
- [x] A class with the same domain twice, or with no features, is rejected _(`createDhClass.test.ts`, `updateDhClass.test.ts`, `deleteDhClassFeatureById.test.ts`)_
- [x] Deleting a used domain or a class with subclasses is refused _(`deleteDhDomainById.test.ts`, `deleteDhClassById.test.ts`, both routes' tests)_
- [x] Search under `daggerheart` finds the four catalogues; under `dnd5e` it does not _(`searchAllDomains.test.ts`; the e2e journey)_
- [x] No seed, fixture or test reproduces SRD content (checked in review) _(checked at close, 2026-09-19: every name and text in the unit tests and e2e helpers is invented — "Veilwright", "Lamplighter", "Lantern Step", "E2E Classe …"; nothing is seeded)_
- [x] Neither the app's title nor the repository's contains "Daggerheart" _(checked at close: the metadata title is "Campaign Settings", the repository `nextjs-campaign-settings`; "Daggerheart™ Compatible" shows under the switch while `daggerheart` is selected)_
- [x] New UI copy lands in both `messages/it.json` and `messages/en.json` _(`messages.test.ts` key-set parity)_
- [x] Every new mutation rejects an unauthenticated request _(each action's test; the four DELETE routes' tests)_
- [x] Every new mutation rejects invalid input with field-level errors _(the action tests)_
- [x] Coverage has not dropped _(measured 2026-09-19, `vitest --coverage` on the commit before T1 (`7f1e2de`) vs this close: statements 85.30% → 85.77%, branches 82.62% → 82.64%, functions 83.23% → 83.75%, lines 86.10% → 86.57%. The first measurement at close had dropped — see §11)_

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
- [x] **T6** — The class page composition. _(test: subclasses by tier; cards by level)_
  - _Done 2026-09-19._ `/classes` (public list, `DhClassLibrary`: each class with its two domains, linking to its page) and `/classes/[id]` (`DhClassPageView`): the class's fields, its features in order, the Hope feature with "Cost: 3 Hope", its subclasses (`DhSubclassOnClassPage`) with features grouped by `groupFeaturesByTier` — **empty tiers skipped here**, unlike the editor — then both domains' cards **merged and grouped by level** (one `DhDomainCardsByLevel`, which now takes a `levelHeading` so the groups sit under the page's `h2`). `fetchDhClassPage` is two reads (the class with features, domains and subclasses; then the cards `WHERE domainId IN (a, b)`); the card's-domain select and schema moved to `dhDomainCardDomainSchema.ts`, shared with the card list. Every formatted text on the page goes through one `ResolvedRecordLinks`. The sidebar's Classes tile now opens `/classes`, with "Manage" for the admin list; **Subclasses keeps the admin list** — a subclass has no public list, it is shown on its class's page.
- [x] **T7** — Search includes the four catalogues under `daggerheart`. _(test: system filter)_
  - _Done 2026-09-19._ `SEARCH_DOMAINS` (still the hand-written opt-in list; campaign content stays out) and `RECORD_LINK_DOMAINS` gain `dhDomains`, `dhDomainCards`, `dhClasses`, `dhSubclasses` — **stored strings** in `data-record-domain`, so renaming one is a data migration. Each is classified by its `pagesConfig` system, so under `dnd5e` none is queried and a link to one renders as text. The picker inherits them; `fetchRecordLinkTargets` resolves them. Destinations (`recordHref`): a domain or a class opens its page; a card opens the card list filtered to its name; **a subclass opens `/subclasses/[id]`, which redirects to its heading on its class's page** (`subclassAnchor`) — a stored link carries only the id, so the class is looked up there. "See all" for subclasses goes to the admin list, the only one they have.
- [x] **T8** — i18n, a11y, e2e: author a domain, a card, a class with a subclass; see the class page. _(test: e2e, invented content only)_
  - _Done 2026-09-19._ **i18n** — no hardcoded copy in the Daggerheart UI (read through `app/ui/dh*` and the routes); the new keys (`dhClasses.classPage.*`, the four `common.cards.dh*` group headings) are in both catalogues. The search page's placeholder and prompt, and the record-link picker's prompt, listed the 5e domains by name, which read wrong under `daggerheart`; they now name "this game system's catalogues". **a11y** — `e2e/a11y.spec.ts` scans the three public and four admin Daggerheart lists, plus a fixture-backed test for the card list as card views, a domain's page, the class list and a class page with a subclass and a card. **e2e** — `e2e/daggerheart-class-page.spec.ts`: two domains, a level-2 card, a class, a subclass with a foundation and a mastery feature; the class page from the public list (tiers, the card under "Livello 2"); search finds the class under `daggerheart` and not under `dnd5e`; deleted in reverse order, and again in `finally`. The fixture builders live in `e2e/helpers/daggerheart.ts` (the two earlier Daggerheart specs keep their own copies). **Licence** — see §8. **Coverage** — see §11.

## 11. Outcome

Shipped 2026-09-19, T1–T8 in four PRs. Under `/dashboard/daggerheart/` the DM
can author domains (colour, emblem), domain cards (with a card view and a
rows/cards switch), classes (two domains, Hope feature, ordered features) and
subclasses (spellcast trait, features by tier); a class's page shows all of it,
with both domains' cards by level; and search and record links reach all four
catalogues under `daggerheart` alone. Nothing is seeded.

**Deviations from the agreed text**

- **`cardLevel` / `cardType` (T3).** §6's `level` and `type` are those column
  names, but `cardLevel`/`cardType` in code (`@map`): the metadata layer's keys
  are one namespace, where spells' `level` and magic items' `type` already live.
  Recorded in `CLAUDE.md`'s decisions.
- **A class is created with its first feature (T4).** "At least one feature" is
  enforced by the create taking the first feature beside the class's fields,
  and by refusing to delete the last one — not by a check at save, since a
  feature has no save of its own before its class exists.
- **Features are edited in the list's edit dialog (T4, T5).** There is no
  separate class or subclass edit page; the inline editors (ADR-0011) sit in the
  dialog the admin list opens.
- **`spellcastTrait` is `"none"` in the form, `null` in the column (T5)** — a
  string validator cannot output `null`. Not filtrable for that reason.
- **A subclass's feature moved to another tier goes to that tier's end (T5).**
- **The class page merges both domains' cards into one set of level groups
  (T6)**, each card naming its domain on its band, rather than one set per
  domain; and it skips a subclass's empty tiers.
- **No public subclass list (T6).** §5.5's "shown on their class's page" is
  the public view; the sidebar tile keeps the admin list, and links to a
  subclass land on its class's page through a redirect route (T7).
- **The search copy stopped naming the 5e domains (T8)**, since the same page
  now serves Daggerheart.

**Coverage** (vs `7f1e2de`, the commit before T1): statements 85.30% → 85.77%,
branches 82.62% → 82.64%, functions 83.23% → 83.75%, lines 86.10% → 86.57%.
The first measurement at close had dropped on all four (statements 82.84%,
branches 80.56%): T2–T5's routes, pages and inline feature form had no unit
tests of their own. Close added them — the Daggerheart layouts, list, detail
and new pages; the class and subclass DELETE routes; `DhFeatureForm`; the
libraries; the fetches — and folded `ModalButton`'s ten identical save
handlers into one.

**Left open:** the two earlier Daggerheart e2e specs could use
`e2e/helpers/daggerheart.ts` instead of their own copies of its helpers.

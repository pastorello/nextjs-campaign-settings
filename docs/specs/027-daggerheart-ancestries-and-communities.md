# SPEC-027: Daggerheart — ancestries and communities

- **Status:** In progress — T1–T3 shipped 2026-10-01. Agreed 2026-09-30. Written by Claude from SPEC-018 §6; the DM approved it and answered its question (§9).
- **Date:** 2026-09-30
- **Phase:** 4
- **Related:** [SPEC-018](./018-game-systems.md) T5 (§5 licence constraints and §6 catalogue structure, binding here) · [SPEC-021](./021-daggerheart-domains-and-classes.md) (the first Daggerheart slice; this one reuses its patterns) · [ADR-0013](../adr/0013-game-systems.md) · [`daggerheart.md`](../domain/daggerheart.md) · [`licensing.md`](../domain/licensing.md) · [SPEC-006](./006-factions.md) and [SPEC-004](./004-world-model.md) (the factions and places a community links to)

---

## 1. Problem

Under `daggerheart` the DM can write domains, cards, classes and subclasses
(SPEC-021), but not the two heritage catalogues a character is built from: the
**ancestry** (what a character is) and the **community** (where and among whom
they grew up). Communities are also part of the world. The DM's setting has
peoples tied to regions and to organisations, and today nothing records that
tie for Daggerheart.

## 2. Goal

Under `daggerheart`, the DM authors ancestries and communities. They see each
one as a card, and a community names the places and factions it belongs to.

## 3. Non-goals

- **Any rules content in the repository** (SPEC-018 §5, DPCGL 2.0). Nothing is
  seeded, and tests and fixtures use invented names and text only.
- **Characters.** A character's chosen ancestry and community, and mixed
  ancestry (combining two ancestries' features), belong to the character spec
  SPEC-021 deferred.
- **Printing cards and import**, as decided for SPEC-021 on 2026-09-19.
- **A community as a world entity.** It is a Daggerheart catalogue that _links
  to_ the shared world (SPEC-018 §6). The world does not gain a "people" concept
  that 5e would also see.

## 4. User stories

- As a DM, I want to write an ancestry with its two features, so that my
  setting's peoples exist next to the ones I copy for private play.
- As a DM, I want to write a community and say which places and factions it
  belongs to, so that the heritage options are rooted in my world.
- As a DM, I want to see an ancestry or a community laid out as a card, so that
  I can check how it reads.

## 5. Behaviour

**Main flow**

1. **Ancestries** have a list, a form and a card view. Fields:
   - name;
   - description (formatted, SPEC-019);
   - image (SPEC-020);
   - two features, each a name and formatted text;
   - origin (`homebrew` | `srdReference`, default homebrew).

   Both features are required: an ancestry has **exactly two** (SPEC-018 §6).

2. **Communities** have a list, a form and a card view. Fields:
   - name;
   - description (formatted);
   - image;
   - characteristic adjectives (optional, one line of text);
   - one feature (name and formatted text);
   - linked places (zones, any number);
   - linked factions (any number);
   - origin.
3. The **card view** follows SPEC-021's domain card: a card-shaped panel with
   the image, the name, and the features in order. For a community it also
   shows the adjectives and names its places and factions as links. Each list
   switches between rows and cards with `?view=cards`, rows by default, as the
   domain card list does.
4. **Header filters:** origin on both lists; place and faction on the
   community list.
5. **Search** (SPEC-011) and **record links** (SPEC-019 T5) reach both
   catalogues under `daggerheart` only, as SPEC-021 T7 did for the first four.
6. **The world side.** Under `daggerheart` only, a place's popover and a
   faction's card list the communities linked to them (§9).

**Edge cases**

| Situation                                            | Expected behaviour                                             |
| ---------------------------------------------------- | -------------------------------------------------------------- |
| An ancestry saved with one feature                   | Field error on the missing feature's name and text             |
| A linked place or faction is deleted                 | The link disappears; the community stays                       |
| A community is deleted                               | Its links disappear; places and factions are untouched         |
| A place linked to a community is moved or reparented | Nothing changes: the link is to the place, not to its position |
| Either catalogue under `dnd5e`                       | Not found, like every Daggerheart page                         |
| Empty catalogue                                      | The standard empty state; nothing is seeded                    |

## 6. Data model changes

```prisma
// proposed — dh prefix, like SPEC-021's tables
model dhAncestry {
  id           Int     @id @default(autoincrement())
  name         String
  description  String?
  imageId      Int?    @unique // SPEC-020
  featureAName String
  featureAText String
  featureBName String
  featureBText String
  origin       String  @default("homebrew")
  // + createdAt / updatedAt
}

model dhCommunity {
  id          Int       @id @default(autoincrement())
  name        String
  description String?
  imageId     Int?      @unique
  adjectives  String?
  featureName String
  featureText String
  origin      String    @default("homebrew")
  places      zone[]    @relation("dhCommunityPlaces")
  factions    faction[] @relation("dhCommunityFactions")
  // + createdAt / updatedAt
}
```

- **Features are columns here, not ADR-0018's per-owner feature table.** That
  ADR is for _ordered lists_ of features edited inline. An ancestry has exactly
  two features and a community exactly one, never reordered, so they are
  ordinary fields. Fixed columns also enforce "exactly two" on their own,
  whereas a list would need a count check.
- **Links are implicit many-to-many relations**, as `calendarEvent`'s links to
  places and factions already are. Deleting either end removes the link row.
  `zone` and `faction` gain a back-relation each and no column.
- Additive migration; no backfill; nothing seeded. Reversible by dropping the
  new tables.

## 7. Metadata changes

- Two new domain metas under `app/lib/config/daggerheart/`:
  `dhAncestryMeta` and `dhCommunityMeta`. Each page declares
  `system: "daggerheart"` in `pagesConfig`.
- `origin` and `imageId` reuse the shared fields SPEC-021 T2 introduced.
- **Key names avoid the flat namespace's collisions** (`CLAUDE.md`, 2026-09-19).
  `featureText` belongs to domain cards, so the ancestry uses
  `ancestryFeatureAName`/`…Text` and `ancestryFeatureBName`/`…Text`, and the
  community uses `communityFeatureName`/`…Text`, all `@map`ped to §6's columns.
  `DomainMetaPairs` gains the new pairs.
- The places and factions links are `Multiselect` fields over tables, like
  `worldHistoryLinkMeta`'s.

## 8. Acceptance criteria

- [ ] Ancestries and communities can be created, edited, listed with filters and deleted under `daggerheart`, and are not found under `dnd5e`.
- [ ] An ancestry without both features is rejected with field errors.
- [ ] A community's places and factions are saved, shown as links on its card, and filterable.
- [ ] Deleting a linked place or faction keeps the community; deleting a community keeps the place and faction.
- [ ] Both lists switch between rows and card views.
- [ ] Search under `daggerheart` finds both catalogues; under `dnd5e` it does not.
- [ ] Under `daggerheart`, a place's popover and a faction's card list their communities; under `dnd5e` they do not.
- [ ] No seed, fixture or test reproduces SRD content (checked in review).
- [ ] New UI copy lands in both `messages/it.json` and `messages/en.json`.
- [ ] Every new mutation rejects an unauthenticated request.
- [ ] Every new mutation rejects invalid input with field-level errors.
- [ ] Coverage has not dropped.

## 9. Implementation plan

- **Schema** (T1): `dhAncestry` and `dhCommunity` as §6, the feature keys
  prefixed in code and `@map`ped to §6's columns; the community's links are
  implicit many-to-many relations (`_dhCommunityPlaces`,
  `_dhCommunityFactions`); both tables own a record image. One additive
  migration.
- **Metadata** (T1): `dhAncestryMeta` and `dhCommunityMeta`, built on a
  shared pair of feature-field helpers (`dhFeatureFields.ts`). The
  key-collision check became computed over every pair of domain metas, so
  the two new metas are checked against all the others; the hand-kept list
  had already missed pairs.
- **Ancestries** (T2) copy SPEC-021's domain card end to end: list with
  rows/cards (`CardListViewSwitch`, now shared), admin list, form, delete
  route, nav tile. A rules catalogue, so it joins `PLAYER_PAGES` unfiltered
  (SPEC-022 R14), and its picture is shown to players.
- **Communities** (T3): the same, plus the links. Filtering by place or
  faction maps the multiselect's `hasSome` to a relation filter. For a
  player (SPEC-022), a community's links name only visible places and
  revealed factions.
- **The world side** (T3): `fetchEntitiesAtPlace`-style reads for a place's
  popover and a faction's card, shown under `daggerheart` only.
- **Search and record links** (T4), as SPEC-021 T7.

**Risks**

- **Two relations from a catalogue into the shared world.** Nothing in
  SPEC-021 touched `zone` or `faction`. The `isPageInSystem` filter already
  hides the catalogue under `dnd5e`, but a world page showing communities must
  check the URL's system itself.

**Answered by the DM on 2026-09-30**

1. Should the world show its communities? **Yes, under `daggerheart`**: a
   place's popover and a faction's card list their linked communities.

## 10. Task breakdown

- [x] **T1** — Schema and metas for both catalogues. _Done 2026-10-01._
      Migration `20261001100000_spec027_heritage`; the computed meta-pair check.
- [x] **T2** — Ancestries end to end. _Done 2026-10-01._
  - List with rows/cards, admin list, form, `DELETE /api/ancestries/[id]`,
    nav tile; under `dnd5e` every page is a 404.
  - Both features are required fields: one alone is refused field by field.
  - A rules catalogue: open to players (`PLAYER_PAGES`), and its picture is
    visible to them (`isRecordImageVisible`).
  - E2E `daggerheart-ancestries.spec.ts` (refused with one feature, card
    view, edit, delete, 404 under 5e); the a11y scan covers its four pages.
- [x] **T3** — Communities and their links, and the world side (§5.6).
      _Done 2026-10-01._
  - List with rows/cards, admin list with place and faction filters, form
    with the two multiselects, `DELETE /api/communities/[id]`, nav tile.
  - Links: `connect` on create, `set` on update when the payload carries
    them; a missing place or faction is a field error
    (`checkDhCommunityLinks`). The list's place and faction filters are
    relation filters (`buildDhCommunityWhere`), not getQuery's scalar
    `hasSome`.
  - The world side: a place's popover (`PlaceCommunityList`) and a
    faction's card list their communities, under a system with
    communities only (`isPageInSystem`).
  - For a player (SPEC-022), a community's links, its filters, the
    popover list and the faction map are limited to visible places and
    revealed factions. The catalogue itself is open to every player.
  - E2E `daggerheart-communities.spec.ts`: a community tied to a place and
    a new faction, its card's links, the faction's card naming it back
    under Daggerheart and not under 5e, and the faction kept when the
    community is deleted. The a11y scan covers its four pages.
- [ ] **T4** — Search, record links, i18n, a11y and e2e with invented
      content.

## 11. Outcome

_Fill in at close._

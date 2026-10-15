# Project State — Campaign Settings

**Last updated:** 2026-10-15
**Status:** Working prototype, not production-ready
**Running it:** [`SETUP.md`](./SETUP.md) — install, configure, seed, run the suites
**Phase:** 4 (session preparation) — Phases 1–3 are complete, most of Phase 4 has shipped, and Phase 5 started early; see [`ROADMAP.md`](./ROADMAP.md)
**Goal of the current phase:** move from reference material to something the DM uses while _preparing_ a session. Campaign management, the calendar and the encounter builder have shipped; session notes and the quick-reference panel have not. (Play-time tools — initiative, dice, random generators — were dropped on 2026-09-22; see ROADMAP's _Explicitly not planned_.) Phase 5 items have landed out of order — formatted text, record images, roles and party visibility, the credits view — so the phase number is a reading order for `ROADMAP.md`, not a queue.

**The standing goal underneath every phase** is unchanged: keep the project sustainable to work on — no bugs, no dead code, tested, documented, CI-verified, organised so a future session (human or agent) picks it up cheaply. Phases 1 and 2 established that; every phase since builds on it without regressing it (see `ROADMAP.md`, "Phases close; they do not stay closed").

---

## 1. What this project is

A self-hosted web app for a Dungeon Master to build a homebrew campaign setting and prepare sessions in it. **One world, two rule sets** — D&D 5e and Daggerheart ([ADR-0013](./adr/0013-game-systems.md)) — each under `/dashboard/<system>/`, with a switch in the sidebar. The world itself is shared; the rules catalogues belong to one system and 404 under the other.

Each catalogue is a page declared in the metadata layer. The live list is
`grep -o 'PageType\.[A-Za-z]*' app/lib/config/pagesConfig.ts | sort -u`, and the
`system:` key in that same file is what assigns each one (absent = shared, ADR-0013 rule 4):

| Scope       | Pages                                                                                                                                             | What they hold                                                                                            |
| ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------- |
| Shared      | `npc`                                                                                                                                             | Name, title, role, alignment, faction, location, appearance, personality, motivations, secrets            |
| Shared      | `deities`                                                                                                                                         | Patrons with rank, tarot card, celestial body, element, tradition, alignment, divine residence            |
| Shared      | `faction`                                                                                                                                         | Organizations and groups with descriptions, rosters of NPCs                                               |
| D&D 5e      | `spells`                                                                                                                                          | Spell compendium with level, subclasses (`circle`), classes, casting time, range, duration                |
| D&D 5e      | `magicitems`                                                                                                                                      | Items with rarity, type, attunement flag, and (SPEC-013) a consumable/permanent flag                      |
| D&D 5e      | `treasure`                                                                                                                                        | SPEC-013's catalogue of non-magical valuables — coins, art objects, gems, trade goods                     |
| Daggerheart | `dhDomain`, `dhDomainCard`, `dhClass`, `dhSubclass`, `dhAncestry`, `dhCommunity`, `dhAdversary`, `dhEnvironment`, `dhWeapon`, `dhArmor`, `dhLoot` | The character-build and GM-side catalogues of SPEC-021, SPEC-027, SPEC-028 and SPEC-029 — described below |

**Geography is shared and sits outside that list**, because it is not a metadata-layer catalogue: an interactive world map (Leaflet) under `app/modules/maps/`, with a tree of places, landmarks, polygon footprints (SPEC-024, [ADR-0019](./adr/0019-polygon-geometry-from-small-libraries.md)) and measurement. Campaign management is outside it too, for the same reason — see below.

> **This section described a single-system app until 2026-10-15.** It opened
> _"a CRUD dashboard over seven domains"_ for _"a D&D 5e campaign setting"_, and
> the table had no system column — while the paragraphs immediately below it
> described the two systems and the eleven Daggerheart catalogues that shipped
> between 2026-09-19 and 2026-10-01. The table is a section's summary and is what
> a reader stops at, so the one part of §1 that had not been updated was also the
> part most likely to be believed.

**Campaign management (SPEC-013) shipped 2026-08-19, outside this table.** `campaign`, `adventure`, `scene`, `sceneCreature` and `loot` are Phase 4 additions with their own shape — `scene`/`sceneCreature`/`loot` are ordered inline collections deliberately kept outside the metadata layer ([ADR-0011](./adr/0011-inline-collections-outside-the-metadata-layer.md)), not a domain in the table above. The pages live under `app/[locale]/dashboard/[system]/campaign/` (the list), `campaign/[campaignId]/` and `adventure/[adventureId]/`: the adventure ladder, scenes with their creatures and loot edited inline, the budget panel reading `getBudgetTotals`, and the awarded/taken check-offs. The task-by-task account of how it got there is [SPEC-013](./specs/013-campaign-management.md) §11, which is where it belongs now that it is closed.

**The calendar and timeline (SPEC-014) shipped 2026-09-18.** Dates are stored as a universal day number and read through DM-defined date systems ([ADR-0015](./adr/0015-time-as-a-universal-day-number.md)); three shared pages sit under `/world` and `/campaign`: `/world/calendar` (the date systems and the moon's reference), `/world/history` (world events linked to places, NPCs, deities and factions) and `/campaign/<id>/calendar` (the campaign's own events, its current day, past/upcoming, world history interleaved). Both event pages have a chronological list and a keyboard-navigable month grid with moon phase and zodiac sign; which date system a viewer reads dates in is a cookie. Architecture: [`ARCHITECTURE.md` §4, "The calendar"](./ARCHITECTURE.md#the-calendar-spec-014). `adventure.timeline` is gone (T8): the calendar's events replaced it.

**Formatted text (SPEC-019) shipped 2026-09-19.** Every description field
across the app (spells, magic items, NPCs, factions, treasures, campaigns,
adventures, scenes, calendar events, places and landmarks) is now edited with
a toolbar editor — bold, italic, two heading levels, bulleted/numbered lists,
and links to other records in the app — and displayed formatted. The value is
stored as a restricted HTML fragment in the same text column as before,
sanitised on every write and again on every render
([ADR-0016](./adr/0016-formatted-text-as-sanitised-html.md)); a stored plain-text
value keeps rendering exactly as it always has. `ControlType.RichText` is a new
metadata-layer control (`app/ui/forms/inputs/RichTextInput.tsx`), so the
feature reached the ADR-0011 bespoke editors the same way every other field
does. See the spec's §11 for the full outcome.

**Images on records (SPEC-020) shipped 2026-09-19.** NPCs, deities, magic
items, treasures, factions and places each carry one image, through
`ControlType.Image` (`app/ui/forms/inputs/ImageInput.tsx`). Uploads are decoded,
stripped of metadata and resized server-side with `sharp` (a 1600 px display
version and a 256 px thumbnail; the original is not kept), stored under
`UPLOAD_DIR/records` and served only to a logged-in session
([ADR-0017](./adr/0017-record-images.md)). Cards show the display version,
list rows and card headers a thumbnail (`RecordThumbnail`, a placeholder when
there is none), and a place's popover shows each attached NPC's or deity's
portrait beside its name — the DM's revision of the original "map pins", which
SPEC-008 had already removed. Known gap: abandoned uploads leave orphaned
files, with no sweep yet. See the spec's §11.

**Daggerheart's first catalogues (SPEC-021) shipped 2026-09-19.** `daggerheart`
is the second game system ([ADR-0013](./adr/0013-game-systems.md)), live in the
sidebar switch. Under `/dashboard/daggerheart/` the DM authors domains (a
palette colour and an emblem), domain cards (a card view, and a rows/cards
switch on the list), classes (two domains, a Hope feature, ordered features)
and subclasses (spellcast trait, features by tier) — four metadata-layer
domains under `app/lib/config/daggerheart/`, `dh`-prefixed tables, features one
table per owner ([ADR-0018](./adr/0018-daggerheart-features-one-table-per-owner.md))
edited inline per ADR-0011. A class's page (`/classes/[id]`) shows its
features, its subclasses by tier and both domains' cards by level; search and
record links reach those four under `daggerheart` only. The 5e
catalogues are a 404 there, and the Daggerheart ones under `dnd5e`. No rules
content is in the repository: nothing is seeded, and tests use invented
content (SPEC-018 §5). See the spec's §11.
Ancestries and communities followed on 2026-10-01 (SPEC-027); a community
links to places and factions, and the place popover and faction cards name
their communities under `daggerheart` only. Adversaries and environments
followed the same day (SPEC-028): GM-side stat blocks, the DM's alone (no
player page, search hit or record link), with inline experiences and
features and environments linked to adversaries and places. Equipment
followed (SPEC-029): weapons and armor, open to players, and loot, the
DM's alone, under one "Equipment" sidebar group. Campaign management closed
the slices (SPEC-030): a Daggerheart campaign's adventures count
milestones instead of XP, price fights in Battle Points from their
adversaries against the party's budget, and hold loot as gold in handfuls
and equipment; a 5e campaign is unchanged.
The encounter builder shipped on 2026-10-02 (SPEC-031): each fight row
links out to its statistics, and an NPC row to the NPC's page; a 5e row's
challenge rating fills its XP, and a 5e fight shows its XP against the
party's SRD 5.2.1 budgets with a band (Facile, Media, Difficile, Letale).
The adventure page's number of characters and each creature's counted
quantity change on the fly, kept only in the browser, and both systems'
difficulty follows them.

**Identifiers are English; the UI ships bilingual (Italian + English).** See [ADR-0005](./adr/0005-english-identifiers.md), implemented as TD-19 on 2026-07-30, and [ADR-0006](./adr/0006-bilingual-ui.md), implemented as TD-21 — copy lives in `messages/{it,en}.json`, not in JSX. Postgres columns keep their Italian names, decoupled from the code by Prisma `@map` (`name @map("nome")`) — so raw SQL and `psql` still show `nome`, `descrizione`, `livello`.

> **This section used to say the opposite,** and the correction is worth keeping.
> It read: _"The domain vocabulary is **intentionally Italian**… a deliberate
> choice, not an inconsistency to fix."_ ADR-0005 explicitly supersedes that
> sentence — the mixture "was not [deliberate], it was inferred from the code and
> recorded as intent in error". The stale version survived here for eight days
> after the ADR was accepted, telling anyone who started a session from this file
> not to fix the exact thing the ADR mandates fixing.
>
> The 16 residual Italian identifiers this note used to track as open (TD-33)
> were finished on 2026-07-30. What remains Italian is deliberate and documented:
> Postgres column names, decoupled by `@map`, and the DM's own campaign content.

---

## 2. Stack

| Layer          | Technology                                                            | Pinning                                        |
| -------------- | --------------------------------------------------------------------- | ---------------------------------------------- |
| Framework      | Next.js (App Router, RSC, Server Actions)                             | pinned exactly (TD-07)                         |
| Runtime        | React                                                                 | pinned exactly (TD-07)                         |
| Language       | TypeScript (`strict: true`)                                           | pinned exactly                                 |
| Database       | PostgreSQL via Docker Compose                                         | port 5432                                      |
| ORM            | Prisma with `@prisma/adapter-pg` driver adapter                       | caret; CLI and client bump together (TD-59)    |
| Auth           | NextAuth v5 (beta) — Credentials provider + bcrypt                    | beta, pinned exactly                           |
| Styling        | Tailwind CSS v4 + `@tailwindcss/forms`                                | caret                                          |
| UI primitives  | Radix UI, Headless UI, Heroicons, Lucide, Framer Motion, Vaul, Sonner | —                                              |
| Maps           | Leaflet + custom hook layer                                           | caret                                          |
| Map geometry   | Turf, `polygon-clipping`, `polylabel` (SPEC-024, ADR-0019)            | caret                                          |
| i18n           | `next-intl`, catalogues in `messages/{it,en}.json` (TD-21, ADR-0006)  | caret                                          |
| Formatted text | Tiptap editor + `sanitize-html` on write and render (SPEC-019)        | caret                                          |
| Images         | `sharp` — decode, strip, resize server-side (SPEC-020, ADR-0017)      | caret                                          |
| Validation     | Zod                                                                   | caret                                          |
| Tests          | Vitest + Testing Library · Playwright                                 | see §6 — counts are derived, not recorded here |

> **Version numbers deliberately left out of this table, 2026-08-13.** It used to carry one per row, and four of them had rotted (Next.js, Prisma, Zod, and the Tailwind/Leaflet patches) — the same failure `docs/README.md` §Keeping them honest describes and this file's §6 already fixed for test counts. `package.json` is the source of truth; `pnpm ls next react prisma zod` shows what is actually installed. What is worth recording is the _pinning policy_, which is a decision and does not rot: `next`/`react`/`react-dom` are pinned exactly (TD-07), and Prisma's CLI and client are grouped so they cannot bump independently (TD-59).
>
> **Five rows were added on 2026-10-15,** for subsystems that had shipped without
> reaching this table: map geometry, i18n, the rich-text editor and its sanitiser,
> and image processing. Dropping the version numbers stopped the rows from rotting;
> it did nothing about the rows that were never written. `node -e "console.log(Object.keys(require('./package.json').dependencies).join(' '))"`
> is the full list, and is the check this table failed.

pnpm is the only package manager (TD-07): `package-lock.json` is gone, `packageManager` and `engines` are declared, and CI derives its pnpm version from that field rather than pinning its own.

---

## 3. Repository layout

```
.
├── app/
│   ├── api/                 # Route handlers: one DELETE per domain (both systems),
│   │                        #   countries GeoJSON, map images (ADR-0008),
│   │                        #   record images (ADR-0017)
│   ├── [locale]/dashboard/[system]/   # Authenticated area (locale: TD-21 · system: ADR-0013)
│   │   ├── (overview)/      # Landing cards
│   │   ├── admin/           # Create pages for each domain
│   │   ├── campaign/ adventure/       # SPEC-013, SPEC-030, SPEC-031
│   │   ├── world/ search/ account/ credits/
│   │   └── spells|magicitems|treasures|npc|deities|factions|geography|domains|…
│   ├── lib/
│   │   ├── actions/         # authenticate.ts + search/ — domain writes live in data/
│   │   ├── auth/            # the four guards of ADR-0020, viewer, visibility scope
│   │   ├── calendar/        # the universal day number and date systems (ADR-0015)
│   │   ├── config/          # Per-domain field metadata (the "meta" system)
│   │   ├── connections/     # prisma.ts (singleton) — the only DB connection
│   │   ├── data/            # Data access and Server Actions, one function per file
│   │   ├── definitions/     # enums / interfaces / types, one per file
│   │   ├── errors/          # typed errors raised across the boundary
│   │   ├── hooks/           # usePageManager, useFilterController, useGameSystem, …
│   │   ├── notifications/   # notify.ts (toast) + logServerIssue.ts (TD-10)
│   │   ├── storage/         # map and record image stores (ADR-0008, ADR-0017)
│   │   ├── test/            # shared test helpers
│   │   └── utils/           # validators, data, richText, i18n, currency helpers
│   ├── modules/maps/        # Self-contained Leaflet module (components/hooks/contexts/types)
│   ├── seed/                # Prisma seed, initial data, and db:import
│   └── ui/                  # Presentational components, one directory per domain
├── e2e/                     # Playwright specs
├── i18n/, messages/         # next-intl request config and the it/en catalogues (TD-21)
├── prisma/                  # schema.prisma + migrations
├── generated/prisma/        # Generated client (gitignored)
├── __test__/                # Next mocks and a handful of suites; almost every test
│                            #   now sits beside the file it covers
├── auth.ts, auth.config.ts, proxy.ts
├── docker-compose.yaml
└── LICENSE, NOTICE.md         # MIT for the code; the SRD 5.2.1 attribution (SPEC-031)
```

This block is a map, not an inventory: `ls -d app/*/ app/lib/*/` regenerates the
two levels that matter, and `find app/api -name route.ts` is the only route-handler
list worth trusting.

> **The `app/api/` line read "5 DELETE, 2 countries GeoJSON, 2 map-image" until 2026-10-15,**
> which was true of the four-domain app and had drifted by a factor of three: there
> is one DELETE endpoint per domain across both systems, and record images added
> three more handlers in SPEC-020. The same line also predated `[system]` in the
> dashboard path, and the `lib/` listing omitted seven directories that exist —
> among them `auth/`, which holds the four guards every mutation in the app calls.
> An agent reading this tree to find where auth lives would have concluded there
> was no such place.

### Architectural patterns already in place

**The "meta" system** is the most interesting idea in the codebase and its main differentiator. Each domain declares its fields once in `app/lib/config/<domain>/<domain>Meta.ts` (field type, label, control type, options). That single declaration drives:

- form rendering (`PageForm` → `InputComponent` → `Select`/`TextInput`/…)
- list columns and sorting
- filter controls
- Prisma `where` clause construction (`app/lib/data/getQuery.ts`)

This is a genuinely good pattern, and since TD-08 it is type-safe: `PageMeta` is a discriminated union on `fieldType`, the registry keys survive inference, the query layer is generic over the Prisma where type, and the `any` count is zero with `no-explicit-any` enforced as an error.

**One generic component per shape** (TD-09): `EntityList` for the admin tables, `EntityLibrary` for the public card lists, `EntityForm` for the shells, `usePageManager` for form state. Each is driven by a declaration in `app/lib/config/` — `listConfig`, `formFields` — rather than by four hand-written copies. The four per-domain quartets they replaced had silently diverged into real defects.

**The maps module** (`app/modules/maps/`) is cleanly separated with its own components, hooks, contexts, constants and types — including an error boundary and a `useSafeMapOperations` hook. It is the best-structured part of the codebase and should be the template for how other domains get refactored.

---

## 4. Data model

`grep "^model" prisma/schema.prisma` is the list and `grep -c` is the count — **35 on
2026-10-15**. They fall into six groups: the 5e catalogues; the seventeen `dh`-prefixed
Daggerheart ones, which are §1's eleven catalogues plus the feature, experience
and link tables that sit one per owner ([ADR-0018](./adr/0018-daggerheart-features-one-table-per-owner.md));
campaign management (SPEC-013, SPEC-030, SPEC-031); the calendar (SPEC-014, [ADR-0015](./adr/0015-time-as-a-universal-day-number.md));
`recordImage` (SPEC-020); and `users` plus the two the world-tree work left behind —
**`zone`** (the places: the tree itself) and **`poi`** (the landmarks sitting on a
place's map).

> **This said "Eight Prisma models" until 2026-10-15,** and named them: the four
> domains plus `users`, `faction`, `zone` and `poi`. That was the schema of
> mid-August; twenty-seven models landed between then and now, so anyone sizing up
> the data model from this line was out by a factor of four. The number above is
> dated for exactly that reason — it will be wrong again, and the command beside it
> will not be.

> **`poi` was the whole tree and is not any more.** SPEC-004 built one polymorphic `poi` table holding places and pins alike ([ADR-0009](./adr/0009-world-tree-as-one-polymorphic-table.md)); [SPEC-008](./specs/008-entity-location-reference.md) T8 split it in two, and `zone` is the tree today — `zone.parentId` is the self-relation, `poi.zoneId` says which place a landmark sits on. Docs written between those two dates say `poi` where they now mean `zone`.

Seed data covers four domains and nothing else: `ls app/seed/initial-data/` holds
`spells`, `magicitems`, `npc` and `deities` — two to five demo records each — plus one
user. A freshly seeded database therefore has no treasures, no campaigns, no calendar
and none of the eleven Daggerheart catalogues; those pages come up empty, which is
expected rather than broken. A real library — 361 spells, 119 NPCs, 62 magic items —
is loaded with `pnpm db:import <export.json>`; those exports are gitignored, because
campaign content is the DM's and the spell prose is rulebook text. _(This paragraph
said "four to six demo records per domain" until 2026-10-15, when "per domain" had
grown from four domains to seventeen catalogues and the sentence had quietly become a
promise the seed never made.)_

Observations:

- ✅ **`createdAt` / `updatedAt` started as TD-11's fix on the four domain models and became the default since.** Most models carry them; `awk '/^model /{m=$2;h=0} /createdAt/{h=1} /^}/{if(m&&!h)print m;m=""}' prisma/schema.prisma` lists the ones that do not. Most of that list is deliberate — the inline child rows of [ADR-0011](./adr/0011-inline-collections-outside-the-metadata-layer.md) and ADR-0018 (`sceneCreature`, `loot`, the feature and experience tables) are only ever read through their parent, and `calendarSettings` is one row per campaign. **`faction` is the one entry that looks like an oversight rather than a decision:** it became a domain in SPEC-006, after TD-11 had set the convention on the four models that existed then, and it is the only metadata-layer catalogue without the pair. It costs nothing today, because nothing in the app reads `createdAt` at all — no sort, no filter, no query (`grep -rn createdAt app/lib/config app/lib/data/getQuery.ts` comes back empty) — so it is not filed as debt. It is recorded here so the next person adding a model does not take `faction` for the pattern.

  `@@index([name])` is on the sixteen catalogue models whose list pages filter and sort by it. Of the nine other models that have a `name`: `users` is indexed by its unique `email`, `faction` and `dateSystem` are small enough not to need one, and the rest are inline child rows read through their parent.

- **Relations are the norm now; option-backed columns are still bare `Int`s.** `grep -c "@relation" prisma/schema.prisma` counts them — 70 on 2026-10-15, where this bullet used to say "in several places". `zone.parentId` is a self-relation with `onDelete: Restrict` — the world tree ([ADR-0009](./adr/0009-world-tree-as-one-polymorphic-table.md)) — `poi.zoneId` puts each landmark on a place, `npc`/`deities` carry nullable `zoneId`/`poiId` FKs ([ADR-0010](./adr/0010-entity-location-as-stored-reference.md), SPEC-008), `npc.faction` has a real foreign key to `faction`, and everything SPEC-013 onwards added is related properly, the inline collections by `onDelete: Cascade` from their parent. What has _not_ changed is the other half: every option-backed column (`alignment`, `rarity`, `class`, …) is still an `Int` indexing a hardcoded TypeScript array. Since TD-61 those are membership-validated at the Zod boundary, so a value outside the list is rejected rather than silently rendering as a blank cell; renumbering an array still repoints existing rows, and that has not changed.
- **✅ `faction` is a domain in its own right.** _(This bullet read "a fifth domain now" until 2026-10-15, counting from the four-domain app.)_ SPEC-004 T1 shipped the table and its foreign key and nothing read either; [SPEC-006](./specs/006-factions.md) (shipped 2026-08-10) made it a domain with its own pages, a roster read from `npc.faction`, and the `PageMeta.optionTable` mechanism driving the NPC form's dropdown from rows rather than a static list. _(This entry said "a table nothing reads" until 2026-08-13, three days after that shipped.)_
- **No ownership**, and per [SPEC-004](./specs/004-world-model.md) §3 that is now a decision rather than a gap: a campaign is a story told inside the one universe, not a scoping boundary, so **no `campaignId` belongs on any entity**. (This section previously said multi-campaign support "requires a schema change" — it does not, because it is not being built that way.) Still true after SPEC-022: `awk '/^model /{m=$2} /campaignId/{print m}' prisma/schema.prisma` finds `campaignId` only on `adventure` and `calendarEvent`, which are the campaign's own structure, never on a world entity. What authorisation does instead is filter reads by what a campaign has been shown; see §5.
- Migrations: `ls -d prisma/migrations/2*` is the list, `| wc -l` the count — 33 on 2026-10-15. This line carried "sixteen as of 2026-08-13" until then; SPEC-010 T1 added a migration the same day it was last corrected, which is why it went stale within hours rather than days, and seventeen more have landed since. Two of the earlier ones are worth knowing about — `20260730020000_rename_png_table_to_npc` (TD-19: `@map` retargets a field, but renaming a _model_ renames the table, so this was hand-written to avoid dropping 119 rows) and `20260806220000_add_faction_table_and_fk` (seeds `faction` with raw SQL, which is why `db push` cannot substitute for `migrate deploy` — TD-73).
- **The migration history is sound; whether your local database is up to date is a question only the command answers.** The history was broken for a long stretch — two migrations unapplied, `migrate dev`/`migrate deploy` both failing against it, every schema change hand-applied — and this entry described that as ongoing and **TD-63** as open until TD-63 closed it on 2026-08-08. That fix holds: migrations have landed cleanly ever since. What does _not_ hold is a recorded verdict about the developer's own database. Checked on 2026-10-15 against the running container: 33 migrations found, 32 applied, and `20261013100000_spec032_campaign_archived_at` **not yet applied** — SPEC-032 shipped two days earlier and the local database had not caught up. Run `prisma migrate status` and, if it says so, `prisma migrate deploy`; a stale local database shows up as a Prisma error on a column that exists in `schema.prisma`, which reads like a code bug and is not one.

  _This line has now gone stale four times. The first three were the count moving; this one was the "✅ verified" itself, which is the part that could never stay true — a verdict about mutable local state, written down in a document that is read months later. What belongs here is the command and the failure mode, not the result of having once run it._

---

## 5. Auth and access control

- NextAuth v5 Credentials provider, bcrypt-hashed passwords in the `users` table.
- `proxy.ts` (Next.js 16's renamed middleware) matches everything except `api`, `_next/static`, `_next/image`, `favicon.ico` and `.png`/`.jpg`/`.jpeg` files. The image exclusion is TD-36's fix — the gate was blocking Leaflet's own tile requests — and [ADR-0008](./adr/0008-map-image-storage.md) is why uploaded maps are served through an authenticated route handler instead of from `public/`: anything under `public/` would be readable by anyone with the URL, which is exactly what the DM does not want for a map of secret locations.
- The `authorized` callback returns `true` if logged in, `false` otherwise, for **every** matched route. After it, the proxy re-reads the account for every signed-in request under `/dashboard` and rewrites a player to the 403 page outside `PLAYER_PAGES` (SPEC-022 T1, T7–T8).

The matcher excludes `/api`, so the proxy cannot protect the route handlers or Server Actions. TD-01 closed that gap at the boundary: every route handler calls `requireApiDm()` and every mutation calls `requireDm()`, each with tests. **Since SPEC-022 T1 (2026-09-30) the guards check the role, not just the session** ([ADR-0020](./adr/0020-roles-in-the-session-and-four-guards.md)). An account is a `dm` or a `player`, the pre-existing account was backfilled to `dm`, and a player gets 403 from every mutation and route, and the 403 page, with no data, from the dashboard. The role is re-read from the row on every `auth()` call. Accounts, campaign membership and per-campaign visibility followed in SPEC-022 T2–T9 (done 2026-10-01): a player reads every page outside R15, filtered to what the campaign they are viewing has been shown. _(`grep -rl "requireDm()" app/lib/data` and `grep -rl requireApiDm app/api` are the current lists; counts written here went stale twice.)_

---

## 6. Current health

**Every gate is green, and none of them is green by exception** — no skipped test, no disabled rule, no lowered threshold. `pnpm typecheck`, `pnpm lint`, `pnpm test` and `pnpm format:check` were re-run on 2026-10-15 and all four pass with nothing skipped. `pnpm build` and `pnpm test:e2e` were not re-run here — the first is slow and floods a session's context, the second needs `.env.test` and a free port 3000 — and both are blocking CI jobs on every pull request, which is the honest place to read their state.

The table below is therefore about what each gate costs and what holds it in place, not about a status that was true on one afternoon:

| Check               | What it took to get here, and what keeps it there                                                                                                                                                                                                |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `pnpm typecheck`    | 19 errors before TD-06. Runs `next typegen` first, and `tsc` on `tsconfig.typecheck.json` since TD-148 — see below                                                                                                                               |
| `pnpm build`        | Turbopack, the same bundler as `dev` (TD-18)                                                                                                                                                                                                     |
| `pnpm test`         | Vitest; nothing skipped, and the coverage ratchet runs with it                                                                                                                                                                                   |
| `pnpm lint`         | 293 warnings before TD-22; every rule back to `error`, including `no-explicit-any`                                                                                                                                                               |
| `pnpm format:check` | Prettier repo-wide (TD-05/TD-16), and the check that most often fails late — run it after the literal last edit                                                                                                                                  |
| `pnpm test:e2e`     | Playwright, nothing skipped (TD-24, then TD-15's zero-violation axe gate); serial, one worker, boots its own dev server                                                                                                                          |
| CI                  | Four blocking jobs in `.github/workflows/ci.yml`: `static` (typecheck + lint + format) · `test` · `build` · `e2e` (TD-23 made the last one blocking). `awk '/^jobs:/{f=1;next} f&&/^  [a-z0-9]+:/' .github/workflows/ci.yml` is the current list |
| Coverage            | Above the Phase 2 exit criterion; a CI ratchet, thresholds in `vitest.config.ts` — never lowered                                                                                                                                                 |
| `.env`              | Gitignored                                                                                                                                                                                                                                       |

> **The "State" column is gone, 2026-10-15.** Every row used to carry a ✅ and the
> claim beside it, which is the same mistake the counts made one paragraph down: a
> status is a measurement, and the document outlives the afternoon the measurement
> was taken on. The CI row was wrong in the same way — the `static` job runs
> `format:check` as a third step, and the row listed only "typecheck + lint", so a
> reader could believe formatting was unenforced in CI. It is the gate that fails
> most often.

> **Counts deliberately are not written here.** This table used to carry "267 tests", "40 E2E", "27.6% lines" and "PRs #1–#61", every one of which was wrong within days — and a 2026-07-30 audit had already caught this same table claiming 117 tests against an actual 173. [`docs/README.md`](./README.md#keeping-them-honest) drew the conclusion: _counts and statuses rot; prose about why does not._ So the numbers now come from the commands that produce them:
>
> ```bash
> pnpm test 2>&1 | tail -4          # unit test and file counts
> pnpm test:e2e --list | tail -1    # E2E count — needs .env.test to exist (see below)
> pnpm test:coverage                # current coverage against the ratchet
> ```
>
> **`--list` needs `.env.test`, despite listing nothing that touches a database.** This line used to promise "no database needed", and that was true until TD-65 added the guard: `playwright.config.ts` refuses to load at all — `--list` included — unless `.env.test` exists with a `DATABASE_URL` distinct from `.env`'s, because the CRUD specs write real rows. `.env.test` is gitignored, so on a fresh checkout this command fails with TD-65's message rather than printing a count. Copy `.env.test.example` first (`docs/TESTING.md` §E2E). Corrected 2026-08-13 — the irony of the anti-drift advice having drifted is the point.

`typecheck` must run `next typegen` first: route-handler signatures live in generated types a fresh checkout does not have, so a bare `tsc --noEmit` passes vacuously. That is why the script is `next typegen && tsc --noEmit` and not just the latter. Since TD-148 (2026-09-30), `tsc` runs on `tsconfig.typecheck.json`, not `tsconfig.json`: the same project minus `.next/dev`, which `next dev` writes and can leave half-written. `next build`'s own type check drops that directory too.

**A local trap, found 2026-07-25 and still live.** An agent worktree left behind in `.claude/worktrees/<name>/` is a _complete second checkout of this repo_ — git-ignored, so `git status` stays clean and nothing hints at it, but ESLint and Vitest walk the filesystem rather than the index, so a leftover one gets collected too: double-counted tests, inflated coverage, thousands of duplicate lint findings, none of it visible in CI since CI checks out clean. Both configs now ignore `.claude/**`, which fixes the counts but not the trap itself — a finished worktree still needs `git worktree remove` by hand, and a stale one still doubles every `grep` hit across the repo.

---

## 7. Dead code inventory

**Cleared by TD-06 on 2026-07-22.** Deleted: `app/ui/components/Header.tsx`, `app/ui/components/NotificationBar.tsx`, `app/ui/forms/PngForm.tsx`, `app/ui/forms/SpellForm.tsx`, `app/lib/connections/sql.ts`, `app/lib/utils.ts` and `app/lib/data.ts`. The two survivors of those last two files moved to their conventional homes (`app/lib/utils/data/generatePagination.ts`, `app/lib/data/fetchCardData.ts`). The `postgres` and `@wordpress/html-entities` packages were uninstalled, and the stray `SpellMetaField;` statement in `createSpell.ts` is gone. `auth.ts` and `fetchCardData` now read through Prisma, so `DATABASE_URL` is the only connection string the app needs.

**Nothing is outstanding here.** Both items this section used to list are closed:

- ✅ `copy-webpack-plugin` and the `webpack` hook are gone from `next.config.ts`, and the plugin is not in `package.json`. The config is still small, but it is no longer the "four lines, `reactStrictMode` only" this entry claimed until 2026-10-15: it also wraps the app in next-intl's plugin (TD-21) and turns on `experimental.authInterrupts`, which is what makes SPEC-022's `forbidden()` and its `forbidden.tsx` page work. `pnpm build` passes on Turbopack (TD-18). This section claimed the hook made the build "fail outright" for three days after §6 above recorded the build as passing; the two statements sat in the same document.
- ✅ `sendNotification.ts` is deleted, along with the whole `app/lib/actions/notifications/` directory. TD-10 split it by audience, which was the actual bug: `app/lib/notifications/notify.ts` raises a sonner toast for the user, `logServerIssue.ts` writes to the server console and does not pretend to be a notification. No `alert()` remains anywhere in `app/`.

Two things are deliberately kept despite having no importers, and must survive a cleanup pass — see CLAUDE.md, _Decisions and rejected approaches_:

- `app/lib/definitions/enums/deities/Circle.ts` — 23 thematic magic circles from the setting's original design, which the DM intends to revisit. (Named `Circolo.ts` until TD-33 renamed it; this line still said the old name until 2026-08-08.)
- `app/ui/components/Spinner.tsx` — a full-page framer-motion loader, orphaned when `BaseButton.buttonState` absorbed the inline save spinner. Reads as an intended `loading.tsx` affordance, not a leftover.

---

## 8. What is genuinely good

Worth saying explicitly, because the refactor should preserve these:

- The metadata-driven form/filter/query system is a real design idea, not boilerplate.
- `app/modules/maps/` is well-factored: separated hooks, contexts, error boundary, typed constants.
- One-concept-per-file discipline in `definitions/` and `data/` is consistent and easy to navigate.
- Prisma singleton correctly guards against hot-reload connection leaks.
- `loading.tsx`, `error.tsx`, `not-found.tsx`, `forbidden.tsx` (SPEC-022) and `Suspense` boundaries are already used — the App Router idioms are understood.
- Skeleton components exist for loading states.

---

## 9. Related documents

- [`ARCHITECTURE.md`](./ARCHITECTURE.md) — how the pieces fit together
- [`TECH_DEBT.md`](./TECH_DEBT.md) — prioritised debt register
- [`TESTING.md`](./TESTING.md) — test strategy
- [`ROADMAP.md`](./ROADMAP.md) — phased plan and backlog
- [`adr/`](./adr/) — architecture decision records
- [`../CLAUDE.md`](../CLAUDE.md) — conventions for AI-assisted development

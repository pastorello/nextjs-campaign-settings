# Roadmap

**Last updated:** 2026-08-18

Two rules govern this document:

1. **Phases 1 and 2 ship before any feature work.** The project's problem is not missing features; it is that the existing ones are unverified. Building on an untested base multiplies the debt.
2. **Feature ideas go here, not into the code.** When one is ready, it gets a spec in [`docs/specs/`](./specs/) before implementation.

---

## Phase 1 — Make it correct

**Goal:** the project builds cleanly, runs safely, and CI proves it on every commit.
**Estimated effort:** 12–16 hours.
**Exit criteria:** `pnpm typecheck && pnpm lint && pnpm test && pnpm build` all green in CI, and the E2E suite (TD-24) green as the fifth gate; no unauthenticated write path exists. **✅ All met.** The `e2e` job stopped being `continue-on-error` on 2026-07-26, once TD-23 fixed the migration drift that was killing it at the seed step — so all five gates block a merge today.

**✅ Phase 1 is complete** — all nine items landed between 2026-07-22 and 2026-07-25.

| #   | Task                                                                   | Debt  | Effort |
| --- | ---------------------------------------------------------------------- | ----- | ------ |
| 1   | ✅ Delete dead code and tutorial leftovers                             | TD-06 | S      |
| 2   | ✅ Fix the remaining TypeScript errors                                 | TD-04 | M      |
| 3   | ✅ Migrate Jest → Vitest; get a green suite                            | TD-03 | M      |
| 4   | ✅ ESLint flat config + Prettier + CI workflow                         | TD-05 | S      |
| 5   | ✅ Auth guards on every mutation and route handler, with tests         | TD-01 | M      |
| 6   | ✅ Zod validation wired from `PageMeta.validator`, with tests          | TD-02 | M      |
| 7   | ✅ Pin `next`/`react`/`react-dom`; pnpm only; `package-lock.json` gone | TD-07 | S      |
| 8   | ✅ Playwright set up; 40 tests across 10 files, blocking in CI         | TD-24 | M      |
| 9   | ✅ Rewrite the README as a portfolio README                            | TD-17 | S      |

Order matters. Deleting dead code first removes roughly half the type errors, so step 2 gets cheaper. Getting the test suite working before the security fixes means those fixes land with proof. See the execution order at the end of [`TECH_DEBT.md`](./TECH_DEBT.md).

---

## Phase 2 — Make it good

**Goal:** the code demonstrates deliberate engineering, not just working behaviour. This is the phase that turns "a project that works" into "a project worth showing".
**Estimated effort:** 16–24 hours.
**Exit criteria:** ✅ zero `any` · ✅ coverage above 70% (**70.09% lines as of 2026-08-04**, TD-46 Tier 2 — TD-37–TD-43 closed their per-tier targets, TD-44 re-scoped the remainder as TD-45/TD-46, both now closed) · ✅ the duplicated component quartets are gone · ✅ a keyboard-only user can complete every flow.

| #   | Task                                                                              | Debt   | Effort |
| --- | --------------------------------------------------------------------------------- | ------ | ------ |
| 1   | ✅ `PageMeta` a discriminated union; `any` eliminated, rule now an error          | TD-08  | M      |
| 2   | ✅ Strict flags, cheap batch + `target: ES2022`; `exactOptional…` on too          | TD-20a | S      |
| 3   | ✅ Rename identifiers to English; `png` → `npc`; columns kept via `@map`          | TD-19  | L      |
| 3b  | ✅ Finish it — the 16 Italian identifiers TD-19 missed                            | TD-33  | S      |
| 4   | ✅ Bilingual UI: extract strings, `messages/{it,en}.json`, locale switcher        | TD-21  | L      |
| 5   | ✅ Schema: `createdAt`/`updatedAt`, `@@index` on the name column                  | TD-11  | M      |
| 6   | ✅ Single shared `where` clause for rows and count                                | TD-12  | S      |
| 7   | ✅ Validate the remaining trust boundaries: env, `localStorage`, GeoJSON          | TD-02b | M      |
| 8   | ✅ Typed error hierarchy; correct status codes; `cause` preserved                 | TD-13  | M      |
| 9   | ✅ Real notifications — Sonner promoted to the root layout                        | TD-10  | M      |
| 10  | ✅ Quartets collapsed into EntityList / EntityLibrary / EntityForm                | TD-09  | L      |
| 11  | ✅ `noUncheckedIndexedAccess` — resolved via documented assertions, not coverage  | TD-20b | M      |
| 12  | ✅ Accessibility pass: axe at zero violations + a keyboard audit                  | TD-15  | M      |
| 13  | ✅ Loading and empty states audited (TD-29 skeletons, TD-30 streaming)            | —      | S      |
| 14  | ✅ Screenshots for the README (spell list + map) — orphaned, deleted (see below)  | —      | S      |
| 15  | ✅ Lint warnings 293 → 0; every rule back to `error`                              | TD-22  | M      |
| 16  | ✅ Auth entry point + DB connection bootstrap untested (0%)                       | TD-37  | S      |
| 17  | ✅ Data-layer `fetch*`/`get*Count` untested for 3 of 4 domains                    | TD-38  | S      |
| 18  | ✅ `app/lib/utils/**` pure functions at 51%, target 95%                           | TD-39  | S      |
| 19  | ✅ Domain metadata declarations untested — `npcMeta`/`deityMeta` under 25%        | TD-40  | S      |
| 20  | ✅ `useFilterController` untested; `app/lib/hooks/**` at 52%, target 70%          | TD-41  | S      |
| 21  | ✅ `app/ui/**` behaviour tests — `EntityForm`/`List`/`Library` first              | TD-42  | L      |
| 22  | ✅ `app/modules/maps/**` geometry + hooks (not rendering) → target 50%            | TD-43  | M      |
| 23  | ✅ Re-measured with `coverage.all: true`; confirmed no blind spot, re-scoped rest | TD-44  | S      |
| 24  | ✅ Page-level route components (`dashboard/**`, `WorldMap.tsx`)                   | TD-45  | M      |
| 25  | ✅ `app/modules/maps/components/**` (Leaflet rendering, 737 lines)                | TD-46  | L      |

**Also landed here, found while doing the work** rather than planned: TD-25 (startup DB-reachability check), TD-26 (`sottoclassi`/`circolo` duplication), TD-27 (a hidden `classi=0` filter on the spell list), TD-28 (seed ids), TD-31 (shared mutable `PageMeta.options`), TD-32 (nine minutes a run of CI apt), TD-36 (`.jpg` map tiles blocked by the auth/i18n matcher). That is seven defects surfaced by hardening work — the argument for the phase.

**What is actually left:** nothing — **Phase 2 is complete.** TD-20b resolved without needing maps-module coverage (documented non-null assertions instead, 2026-07-31 — see its write-up in `TECH_DEBT_ARCHIVE.md`). TD-37–TD-43 (opened 2026-08-01) closed every per-tier coverage target; TD-44 (2026-08-02) confirmed the suite's reach isn't undercounted by `coverage.all` and re-scoped the remaining gap to this phase's 70% exit criterion as two dated items: TD-45 (page-level route components) and TD-46 (`app/modules/maps/components/**` Leaflet rendering), both closed 2026-08-04. **Item 2 (TD-20a) was also already done** — `tsconfig.json` carries every flag the row names (`target: ES2022`, `exactOptionalPropertyTypes`, etc.); the ◑ marker here had simply never been updated after TD-20a's own write-up in `TECH_DEBT_ARCHIVE.md` recorded it finished on 2026-07-31.

**Item 14 (2026-08-06):** `docs/screenshots/spells-list.png` and `map.jpg` were orphaned — taken for a README section the 2026-08-01 trim removed (see `CLAUDE.md`'s decisions log) — and nothing in the repo linked to either file. `CLAUDE.md`'s 2026-08-01 entry explicitly rejects re-adding screenshots to `README.md`, so re-linking was never the live option; both files are deleted.

> **Items 3 and 4 were meant to run together, and did not.** This line used to read
> _"Items 3 and 4 are deliberately adjacent: both touch all 54 domain files, and
> doing them in one pass costs far less than two."_ **TD-19 shipped alone on
> 2026-07-30**, so TD-21 now pays the full cost of reopening those files by itself.
> The saving is spent; do not go looking for a way to recover it. The order was
> still the better one of the two — TD-21 now extracts strings against English
> field keys rather than Italian ones.

The order is load-bearing. Item 1 types the metadata layer, which turns the sweeping edits that follow from unverifiable into compiler-checked.

**Item 10 ran early, before items 3 and 4.** The stated constraint was TD-08, which was done, and collapsing four component quartets into one first shrinks the surface the rename has to cover. It also paid for itself immediately: the duplication was hiding six defects, found only by putting the copies side by side.

---

## Phase 3 — Data model and relations

**Goal:** entities reference each other instead of being isolated lists. This is where the app stops being four spreadsheets and starts being a campaign setting.

**Exit criteria** _(added 2026-08-17 — Phase 1 and 2 both declared one; this phase never had, despite being nearly done)_**:** every ✅ item below actually shipped and merged to `main` · the world tree (SPEC-004/008/009/010) is fully navigable, drawable and prunable · cross-entity search (SPEC-011) shipped · the "campaigns as stories" bullet is understood as a recorded decision, not a blocking task (◑, not ✅ — see below) · zero Phase-3-tagged tech debt open **except** items explicitly deferred with a stated reason (TD-78, TD-79 — both documented, neither silently dropped) · the standard four gates (`pnpm typecheck && pnpm lint && pnpm test && pnpm build`) plus E2E all green, same bar Phase 1 set and Phase 2 never lowered. **✅ All met, 2026-08-17.** SPEC-011's two implementation halves (PRs #160/#161) plus the integration fix its own §11 records (PR #165, a Next.js server/client boundary bug invisible to either half's own unit tests, found only by exercising both together in a real browser) are all merged. Re-verified directly rather than assumed from CI: `pnpm typecheck`/`pnpm lint`/`pnpm format:check` clean and `env -u DATABASE_URL pnpm test` green (175 files, 1268 tests) against the merged `main`, with `Build` and `E2E` already green in CI on both merge commits.

**✅ Phase 3 is complete** — every item below shipped or, for the two intentionally-open exceptions, is documented rather than silently missing.

- **✅ Real relations / locations as first-class entities — superseded by the world tree, not abandoned, and now fully shipped.** [SPEC-003](./specs/003-real-relations.md)'s flat `location`/`faction` tables were superseded the day they were drafted, once the DM's actual intent surfaced: a containment hierarchy (`Universe → Plane → Region → City → Dungeon`, each tier carrying its own uploaded map), not a flat entity list. [SPEC-004](./specs/004-world-model.md) ([ADR-0009](./adr/0009-world-tree-as-one-polymorphic-table.md)) built that instead: one polymorphic `poi` tree table holds every place and every NPC/deity pin, `kind` a closed, code-declared vocabulary rather than a lookup table (TD-61's correctness fix — validated option membership — shipped independently and unaffected). MVP through T4 shipped 2026-08-06/07: create-your-world flow, click-to-descend navigation, the richer kind vocabulary (`plane`/`city`/`dungeon`), the 33 legacy places and four legacy maps migrated into the tree, every existing NPC/deity pinned, and a record's location displayed derived from its pin rather than a stored column. **T5b (2026-08-08) closed the spec**: `npc.location`/`deities.location`/`deities.residence` and their enum vocabularies are dropped, so the world tree is now the only source of truth for placement. _(That tree lives in `zone` today, not `poi`: SPEC-008 T8 split the one polymorphic table into `zone` — the places — and `poi` — the landmarks. The sentence above describes SPEC-004 as it was built.)_ _(Related: TD-11, TD-61.)_

- **✅ Map POIs in the database.** POIs moved out of `localStorage` into Postgres, each optionally linked to exactly one entity — `npc` or `deities` today, extensible to locations, dungeons and treasure without a migration per type. Clicking a marker opens the linked entity. Done 2026-08-01. _(TD-14; specified in [SPEC-002](./specs/002-map-poi-persistence.md).)_
- **◑ Campaigns as stories, not as scoping** — a standing architectural decision, not an open Phase 3 task. _(Reframed 2026-08-06 — this entry previously read "Multi-campaign support: a `Campaign` model with `campaignId` on every entity".)_ A campaign is **a storyline that plays out inside the universe**, not a boundary around every record. Each DM authors exactly one universe — that is the root of everything, per [SPEC-004](./specs/004-world-model.md) — and may run several campaigns within it. What exists today are the raw materials: spells, magic items, NPCs, deities and the map. **This cannot close within Phase 3**, and that is by design, not a leftover: plot, sessions and encounters — the raw material a campaign is actually made of — are Phase 4 work that has not been designed yet, and no `campaignId` belongs on any entity until they are. Revisit once Phase 4's session tooling gives this decision something concrete to apply to.
- **✅ Factions the DM can author.** SPEC-004 T1 shipped the `faction` table and its foreign key; nothing read either until [SPEC-006](./specs/006-factions.md) (shipped 2026-08-10). A faction is an **entity**, not an option list — it has a description, a page of its own alongside the other four domains, and a roster read from `npc.faction` directly. The table-backed-options mechanism (`PageMeta.optionTable`) drives the NPC form's dropdown; the foreign key takes over the membership check `optionValueValidator` used to do, which is what keeps `buildEntitySchema` synchronous. Faction names are content, not translated (like `zone.title`), and a faction has **no** place in the world tree — an emissary of Kang may stand in the orc kingdom. Known gaps, both filed rather than built speculatively: the NPC admin list's faction column lost its header filter (TD-78 — `SortableHeader` has no table-backed equivalent, the same gap `LocationFilterControl` exists for); entity-to-entity links (roster → NPC, NPC card → faction) resolve via `?query=<name>` against the existing list pages, not a new per-entity route — this app has never had one. _(Related: TD-61, TD-74, TD-78.)_
- **✅ Finding records nobody has placed.** Specified in [SPEC-007](./specs/007-placement-backlog.md), shipped 2026-08-10 (PR #142). **The rewrite shrank it to three tasks**, because SPEC-008 shipped both halves the original draft set out to build — the "Sconosciuta" filter and a per-row placement button — a week after that draft was written. What was left was that none of it was findable: an unplaced record's card rendered an empty region, the row button was labelled with a noun, and nothing counted. The DM, asked directly, did not know the button existed. All three landed; two acceptance criteria stayed open and are tracked rather than forgotten — the count does not distinguish "blocked on the parent's map" from any other unpositioned place ([TD-79](./TECH_DEBT.md)), and an entity's location was read through two unreconciled paths (**closed** — [TD-77](./TECH_DEBT.md), 2026-08-13).
- **✅ Making the world drawable — SPEC-007, SPEC-009 and SPEC-010, in that order.** A 2026-08-10 audit against the live database found the thing none of the specs had noticed: **the world is fully described and entirely undrawn.** Forty-two places sit in a correct tree and not one has ever been given coordinates; four of the seven places that have children have no map, and a map can only be set at creation, so those branches are permanently undrawable. Three specs came out of it, and they are a sequence — all three now shipped:
  - **✅** [SPEC-007](./specs/007-placement-backlog.md) — give a place a map after creation (the unblocker), count what is undrawn, and make an unplaced record say so. No schema change. Shipped 2026-08-10.
  - **✅** [SPEC-009](./specs/009-zones-as-areas.md) — a place can be drawn as a rectangle rather than a dot, and containment becomes spatially true: a pin and an area never share ground, so anything inside an area belongs on that area's map, one level down. All five tasks shipped: the `footprint` column and its predicates (T1); drag-to-draw with the create form (T2); a richer presentation of the "would cover these pins" refusal (T3); clicking inside an area descends instead of offering the point flows (T4); resizing/moving an existing area re-runs both checks, closing the last documented gap (T5).
  - **✅** [SPEC-010](./specs/010-deleting-a-place.md) — **there was no way to remove a place from the tree, none, anywhere in the app**, so creating a branch was irreversible through the UI — a prerequisite rather than a nicety, since the DM intends to rebuild the tree's structure from scratch once the other two landed. Shipped 2026-08-13: `poi.lat`/`lng` made nullable so a landmark can be unpositioned the same way a place can (T1); `deletePlace` reparents children/landmarks to the grandparent and detaches entities in one transaction, root undeletable (T2); the confirmation dialog with real counts and its map entry point (T3).

- **✅ Cross-entity search.** Specified as [SPEC-011](./specs/011-cross-entity-search.md) once SPEC-006 shipped, agreed 2026-08-13 with the DM after scoping up from the original four domains to all six (spells, items, NPCs, deities, factions **and places** — the DM chose the larger scope over splitting places into a follow-up). One search box, six grouped result sets capped at 5 with a "see all" link to the domain's own list page; a place result is the one case with no such page, so it instead lands the DM directly on that place's own map via a new ancestor-chain walk and a pre-built `GeographyExplorer` navigation stack. Shipped 2026-08-17 across two parallel implementation PRs (#160 T4, #161 T1-T3) plus one integration fix (#165) a post-merge browser check caught that neither half's own unit tests could — a Next.js server/client boundary violation, since `toStackEntry` originally lived inside a `"use client"` file. _(Related: TD-77, the location-read-path work this spec's place-landing built on top of.)_

---

## Phase 4 — Session tooling

**Goal:** move from reference material to something used _during_ a session.

- **Encounter builder.** Compose an encounter from NPCs with CR-based difficulty calculation.
- **Initiative tracker.** Turn order, HP tracking, conditions. Skeleton spec drafted: [`docs/specs/001-combat-tracker.md`](./specs/001-combat-tracker.md), built against [`docs/domain/5e-combat.md`](./domain/5e-combat.md). Both are stubs awaiting a domain research pass.
- **Session notes.** Timestamped notes linked to the entities they mention.
- **Quick-reference panel.** Pinned spells and items, one keystroke away.
- **Dice roller** with roll history.
- **Random generators** — NPC names, tavern names, plot hooks — seeded from the campaign's own factions and locations.

---

## Phase 5 — Sharing and polish

- **Player-facing read-only view.** Share a location or deity with players without exposing DM-only fields (`secrets`, `motivations`). Requires the authorisation model that does not exist today.
- **Export.** PDF or Markdown of a domain, or of the whole setting.
- **Import.** From D&D Beyond, 5e.tools, or CSV.
- **Rich text in descriptions.** `renderRichText` exists as a stub; make it real.
- **Image uploads** for NPC portraits and item illustrations.
- **PWA / offline** for table use without reliable wifi.
- **A third locale.** Italian and English ship in Phase 2 (TD-21). The catalogue structure supports more, but the ~150 SRD game terms would need sourcing from that language's official rulebook, which is the real cost — not the plumbing.
- **Translating campaign content.** Rejected in [ADR-0006](./adr/0006-bilingual-ui.md): a DM writes their world once, in one language. Dual inputs on every form would guarantee the second language stays empty.
- **`searchAliases`.** One nullable string array per entity, so an English spell name finds an Italian record without any translation-column machinery. Cheap, useful, unscheduled — the honest answer to "I want to find Fireball".

---

## Explicitly not planned

Recording these prevents rediscussing them:

- **Real-time collaboration.** Websockets, presence, conflict resolution — enormous complexity for a single-DM tool.
- **A full VTT.** Roll20 and Foundry exist. This is a campaign _bible_, not a virtual tabletop.
- **Public multi-tenant hosting.** Self-hosted by design; changing that brings GDPR, billing and abuse concerns that dwarf the app.
- **A mobile app.** Responsive web is sufficient. _(See [ADR-0004](./adr/0004-server-actions-over-rest-api.md) on when an API layer would become justified.)_
- **AI-generated content in-app.** Tempting and easy to bolt on; adds a paid dependency and a moderation surface for a feature the target user (one DM, their own world) mostly does not want.

---

## What the DM actually asks for

**This list is not the phase order, and it is not meant to be.** The phases order
work by what the codebase needs; this records what the person using the app says
they miss, asked directly on **2026-08-10**. Where the two disagree, that is worth
knowing rather than smoothing over — a Phase 5 item the DM names unprompted is
better evidence of value than a Phase 3 item nobody has asked for.

Named, in the same breath:

- **Formatted text in descriptions.** Today a description is one block of plain
  text; formatting it means hand-writing HTML. Phase 5's "Rich text in
  descriptions", and the same work as **TD-76** — see that item for why the two
  should be scheduled together rather than one after the other.
- **Images.** NPC portraits, item illustrations, faction emblems. Phase 5's "Image
  uploads". The upload machinery already exists for maps (ADR-0008), so the cost
  is mostly deciding where images live and how they are served, not building a
  store. SPEC-006 §3 defers the faction emblem to its own spec for this reason.
- **Cross-entity search.** Phase 3, above.

### Asked for on 2026-08-18, in one batch — accounts, roles and party visibility

The DM walked the app and reported 29 things in one sitting. The bugs went to the
register (TD-81 – TD-93). What is left is six requests that arrived as six but are
**one system**, and building them in the order they were said would mean building
the same authorisation check three times:

1. **A DM role, distinct from a normal account** — only a DM reaches the edit
   pages and the mutations behind them (maps, spells, NPCs, factions, items); a
   normal account keeps the read pages it has today.
2. **Self-service DM sign-up** from the logged-out screen, with the DM activating
   the account by hand afterwards.
3. **An account-management page** for a logged-in DM.
4. **Password reset** from the logged-out screen.
5. **Party accounts** — the DM creates and manages an adventurer's account (name,
   email, password) for a group of players.
6. **Per-entity visibility to the party** — places, NPCs, deities, magic items and
   factions are each secret or public, toggled from the admin list rows (e.g.
   `/dashboard/admin/factions`).

**The order that actually works is 1 → (2, 3, 4 in any order) → 5 → 6.** Roles
first, because everything else is a rule about who may do what and there is
currently no "who". Party accounts before visibility, because "visible to the
party" has no meaning until a party exists.

**Three things worth knowing before any of this is scheduled:**

- **Item 6 is much larger than it looks, and is the reason this belongs in specs
  rather than in the debt register.** A visibility flag is one column and one
  toggle; _honouring_ it is every read path in the app — each domain's list and
  card, the map's markers, cross-entity search, the dashboard counts — filtering
  by who is asking. Those paths run through the metadata layer, which is
  string-keyed: a read path that forgets to filter keeps working and quietly
  leaks. `CLAUDE.md` records this exact failure mode from TD-19, where a missed
  string key turned into a filter that silently stopped filtering. This spec
  needs an explicit inventory of read paths as part of its acceptance criteria,
  not a general instruction to be careful.
- **Item 6 is also Phase 5's "player-facing read-only view", already on this
  roadmap, already annotated "requires the authorisation model that does not
  exist today."** That prediction is now the request. Treat the two as the same
  work rather than filing a second one.
- **Item 4 has no plumbing.** There is no mail transport in this repo — no
  `nodemailer`, no transactional-mail service, nothing in `package.json`. A
  password reset that emails a link means choosing and configuring one, on a
  self-hosted app whose whole deployment story is `docker-compose`. That choice
  is an ADR, and it is most of the cost of item 4. Worth asking the DM whether a
  reset performed by hand (they already activate accounts by hand, per item 2)
  is enough for now.

**One thing the role model must not sweep up:** temporary scratch markers on the
map (TD-86) are for players too, the DM was explicit. The natural default when
splitting DM from player is "the map is read-only for players", and that default
is wrong here. Whatever shape item 1 takes needs a place for actions that are
neither reads nor campaign edits.

Authentication itself is not from scratch: `next-auth` 5 and `bcrypt` are already
in use, `auth.ts`/`auth.config.ts` exist, and every mutation already checks a
session (`app/lib/auth/requireSession.ts`, TD-01). What changes is that the check
stops being "is anyone logged in" and becomes "is this person allowed" — and it
has to keep living in the Server Action and the route handler, never in the
component that renders the button.

### Decided on 2026-08-18 — the place popover, and making the map measurable

Two feature threads came out of the DM's second pass. Both are recorded here
rather than in the register because both change what the app does, not whether it
does it correctly.

**The place popover.** Clicking a place opens a popover carrying its description
and its actions: "rimuovi definitivamente" and "sposta nei luoghi non
posizionati"; the list of NPCs and deities currently at that place, each with an
X that returns it to the unattached pool; and a control to attach an entity here.

This one surface answers four separate reports — attaching an entity from the
place instead of the map's right-click menu, seeing what lives somewhere,
un-placing without deleting, and the "create la Taverna del Gallo Robin in
Skreebars, then link a character to it" workflow. **It is also the precondition
for TD-93's placement invariant**: blocking a second placement is only reasonable
once un-placing is one click away, and for TD-96, which removes the right-click
entry this popover replaces.

Worth the spec template specifically for its edge cases: what "rimuovi
definitivamente" does to a place that has children (SPEC-010 already decided
reparenting for deletion — this must match it, not invent a second rule), and
what an entity's X means when the entity is attached to a landmark POI rather
than to the zone itself (SPEC-008 T8's two cases).

**Making the map measurable** — three requests that are one feature, in
dependency order:

1. **A scale per map** ("50 pixel = 4.5 km"), set from the map's own edit menu.
   This is the missing piece: the maps are `CRS.Simple`, so the app knows pixel
   distances and nothing else. A stored scale is what turns those into leagues.
   It is a new field on the place alongside `mapBounds`, so it lands naturally
   with **TD-81**, which is already going to touch how a map is framed.
2. **A working measurement tool** on top of it — **TD-94** is the bug (haversine
   metres on a pixel map), but the DM also proposed the interaction: click to
   start, the track draws in red while the mouse moves, a second click ends it
   and drops a marker with the distance. Adopt that; it is clearer than the
   current panel-driven flow.
3. **A grid overlay toggle** next to zoom in / zoom out, so distances can be
   eyeballed without measuring at all. Cheap once the scale exists, and close to
   useless before it — a grid whose squares mean nothing is decoration.

Do them in that order. Each is small; built in the wrong order, the first two are
guesses.

### Reversed on 2026-08-18 — area footprints become polygons

**SPEC-009 shipped rectangles only, and said to revisit "only if rectangles prove
genuinely unusable in practice." They have.** The DM's evidence, drawing the real
campaign map: on the root map the material plane is the upper part of a
hemisphere, and any rectangle over it takes in ground that is not the material
plane; one level down, Kang's realm cannot be boxed without also claiming a piece
of the dwarven kingdom and a piece of Quel'Thalas. The damage is deferred rather
than immediate — it surfaces when those neighbours get their own maps and their
borders contradict the boxes already drawn.

**Why this outranks a normal feature request:** SPEC-009's whole point was that
"containment becomes spatially true." A rectangle that covers a neighbour's
ground makes it spatially _false_, so the current shape does not merely look
wrong, it breaks the guarantee the rest of the map model is built on — including
the refusal rules that stop pins and areas from sharing ground.

**Sized L, and the cost is concentrated in three predicates** that are currently
trivial arithmetic in `app/modules/maps/lib/utils/footprint.ts`:

- **Containment** goes from point-in-rectangle to point-in-polygon. Routine.
- **The derived centre** goes from a midpoint to a centroid — and a concave
  polygon's centroid can fall _outside_ the polygon, which would put a
  horseshoe-shaped region's pin in the empty middle. SPEC-009 writes that centre
  into `lat`/`lng` at creation so every existing consumer keeps working, so this
  needs a real answer (pole of inaccessibility, or an author-placed label point),
  not a formula picked for being short.
- **Overlap** goes from comparing two intervals to polygon-polygon intersection.
  This is the expensive one, and it is load-bearing: "an area may not overlap a
  sibling" is what makes the model coherent.

Plus drawing (drag-to-draw becomes click-per-vertex with a closing gesture, undo
of the last vertex, and a minimum-vertex rule where SPEC-009 had a minimum-size
one), clamping to the map's bounds, and SPEC-009 T5's move/resize editing, which
re-runs both checks on every edit and is where a naive polygon implementation
will hurt most.

**Decide in the spec, not before:** whether to take on a geometry library
(polygon intersection written by hand is a classic source of subtle, data-
dependent bugs) and whether existing rectangles migrate as four-point polygons —
they should, which makes the change additive rather than a break.

### Also asked for on 2026-08-18, and much smaller

- **A breadcrumb trail in the geography header** — `Piani di Esistenza / Piano
Materiale / Regno di Kang / Skreebars` instead of the bare current title.
  **Note what this does and does not reverse.** SPEC-004 §2 already named
  breadcrumbs as part of the goal ("breadcrumbs show the path back to the
  universe"); it was M7's MVP scoping that cut them, and `GeographyExplorer`
  keeps a navigation _stack_ rather than a fetched ancestor chain for that
  reason. The stack already holds exactly the titles a breadcrumb needs, so the
  change is small — and it restores the spec's stated intent rather than
  overturning it, a narrower move than SPEC-009's rectangles needed.
- **Magic-item filters as dropdowns.** Replace the `SelectButtonery` for rarity
  and type with two dropdowns, same height as today's buttons, both on one row.
  A contained UI change to one domain's filter bar.
- **Create a place, then attach entities to it.** The DM's example: create "la
  Taverna del Gallo Robin" inside Skreebars, and link a character there — rather
  than attaching an NPC or deity straight from the map's right-click menu. This
  is the model SPEC-008 T8 already chose (an entity has no coordinates of its
  own; it lives at a place), so the gap is workflow, not data: creating the
  intermediate place has to be quick, and an entity attached to a place has to be
  visible from that place. Relates to TD-85, which is what currently makes the
  place-creation flow hard to reach at all.

None of these displaces SPEC-006 and SPEC-007, both shipped 2026-08-10. They are
recorded here so the question "what should Phase 4 actually contain?" has evidence
behind it when it comes up, instead of being answered from the 2026-07-22 list
alone.

---

## How to pick what is next

1. Anything in Phase 1 outranks everything else.
2. Within a phase, follow the order given — the sequencing is deliberate.
3. Feature ideas get logged here, not built. When one reaches the top, write the spec first.
4. If a bug is found during hardening, fix it with a regression test rather than filing it. That is the point of the phase.

### Phases close; they do not stay closed, and that is fine

**Phases 1 and 2 are complete, and the project is in Phase 3.** That does not mean no Phase-1 or Phase-2 work will ever be filed again, and finding some is not evidence that a phase was closed prematurely.

The evidence is in the register. Every item from TD-61 onward was found while building Phase 3 features, and several are plainly Phase-2-flavoured quality work: TD-61 (missing validation on option-backed fields), TD-62 (hardcoded English strings that TD-21's bilingual pass missed), TD-64 (a lint rule violation), TD-72 (inline styles where the project's rule is Tailwind). They are filed under Phase 3 because that is **when they were found**, not because they belong to Phase 3's goal.

The distinction that matters:

- **A phase's exit criteria are a one-time gate**, checked against the codebase as it was when the phase closed. Phase 2's were met on 2026-08-04 when coverage crossed 70%. That fact does not expire.
- **The standards a phase established are permanent.** Zero `any`, everything validated at the boundary, no hardcoded UI strings, coverage that does not drop — these are now `CLAUDE.md`'s Definition of Done, enforced per change. New work meets them as it lands.
- **So a "Phase 2 item" found today is not a reopened phase.** It is a Definition-of-Done violation in new code, or an older gap the phase's sweep genuinely missed. Fix it under its own TD number and keep going; do not reopen the phase, and do not treat the roadmap's phase boundaries as something to re-litigate.

Do not, therefore, go looking for Phase-2 work to "finish the phase" before starting Phase 3 items. The phase is finished. What remains is the ordinary discipline of not regressing it.

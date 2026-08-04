# Roadmap

**Last updated:** 2026-08-01

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
| 2   | ◑ Strict flags, cheap batch + `target: ES2022`; `exactOptional…` on too           | TD-20a | S      |
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
| 14  | ◑ Screenshots for the README (spell list + map) — taken, now orphaned (see below) | —      | S      |
| 15  | ✅ Lint warnings 293 → 0; every rule back to `error`                              | TD-22  | M      |
| 16  | Auth entry point + DB connection bootstrap untested (0%)                          | TD-37  | S      |
| 17  | Data-layer `fetch*`/`get*Count` untested for 3 of 4 domains                       | TD-38  | S      |
| 18  | `app/lib/utils/**` pure functions at 51%, target 95%                              | TD-39  | S      |
| 19  | Domain metadata declarations untested — `npcMeta`/`deityMeta` under 25%           | TD-40  | S      |
| 20  | `useFilterController` untested; `app/lib/hooks/**` at 52%, target 70%             | TD-41  | S      |
| 21  | `app/ui/**` behaviour tests — `EntityForm`/`List`/`Library` first                 | TD-42  | L      |
| 22  | ✅ `app/modules/maps/**` geometry + hooks (not rendering) → target 50%            | TD-43  | M      |
| 23  | ✅ Re-measured with `coverage.all: true`; confirmed no blind spot, re-scoped rest | TD-44  | S      |
| 24  | ✅ Page-level route components (`dashboard/**`, `WorldMap.tsx`)                   | TD-45  | M      |
| 25  | ✅ `app/modules/maps/components/**` (Leaflet rendering, 737 lines)                | TD-46  | L      |

**Also landed here, found while doing the work** rather than planned: TD-25 (startup DB-reachability check), TD-26 (`sottoclassi`/`circolo` duplication), TD-27 (a hidden `classi=0` filter on the spell list), TD-28 (seed ids), TD-31 (shared mutable `PageMeta.options`), TD-32 (nine minutes a run of CI apt), TD-36 (`.jpg` map tiles blocked by the auth/i18n matcher). That is seven defects surfaced by hardening work — the argument for the phase.

**What is actually left:** TD-20b resolved without needing maps-module coverage (documented non-null assertions instead, 2026-07-31 — see its write-up in `TECH_DEBT_ARCHIVE.md`), so this line was stale calling it "blocked". TD-37–TD-43 (opened 2026-08-01) closed every per-tier coverage target; TD-44 (2026-08-02) confirmed the suite's reach isn't undercounted by `coverage.all` and re-scoped the remaining gap to this phase's 70% exit criterion as two dated items: TD-45 (page-level route components) and TD-46 (`app/modules/maps/components/**` Leaflet rendering).

**Item 14 is only half done.** `docs/screenshots/spells-list.png` and `map.jpg` were taken and are still on disk, but the 2026-08-01 README trim (see `CLAUDE.md`'s decisions log) cut the section that referenced them — nothing in the repo links to either file now. Keep them and re-link, or delete them; leaving orphaned binary assets on disk is its own small drift.

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

Everything below needs a spec before implementation.

- **Real relations.** Replace bare `Int` foreign-key-shaped columns (`faction`, `location`, `alignment`) with actual Prisma relations. Renumbering a hardcoded TypeScript array currently corrupts existing rows silently — this fixes a real correctness problem, not just a modelling nicety. _(Related: TD-11.)_
- **Locations as first-class entities.** A location becomes a record with a description, a map coordinate and the NPCs based there.
- **✅ Map POIs in the database.** POIs moved out of `localStorage` into Postgres, each optionally linked to exactly one entity — `npc` or `deities` today, extensible to locations, dungeons and treasure without a migration per type. Clicking a marker opens the linked entity. Done 2026-08-01. _(TD-14; specified in [SPEC-002](./specs/002-map-poi-persistence.md).)_
- **Multi-campaign support.** A `Campaign` model with `campaignId` on every entity. Prerequisite for anything shared or multi-user. Today's model is one DM authoring one shared world, so no entity is user-scoped — including POIs, which are deliberately global ([SPEC-002](./specs/002-map-poi-persistence.md) §2). Scoping arrives here, for everything at once; nothing should grow its own private ownership column beforehand.
- **Cross-entity search.** One search box across spells, items, NPCs and deities.

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

## How to pick what is next

1. Anything in Phase 1 outranks everything else.
2. Within a phase, follow the order given — the sequencing is deliberate.
3. Feature ideas get logged here, not built. When one reaches the top, write the spec first.
4. If a bug is found during hardening, fix it with a regression test rather than filing it. That is the point of the phase.

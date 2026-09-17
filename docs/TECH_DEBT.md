# Technical Debt Register

**Last updated:** 2026-09-05
**What this file is for:** deciding what to work on next. It carries the summary table and the write-ups of items that are **still open** — nothing else. Every closed item's full write-up lives in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md), which is where to look for whether something was already tried and rejected.

**Open items: TD-79, TD-97, TD-99, TD-105.** Everything else in the summary table is closed. TD-85 and TD-96 were the two `part` items — shipped in half, with the remainder deferred to SPEC-016's popover; both closed on 2026-08-27 with T7–T9, so their write-ups have moved to the archive with the rest.

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

---

## Summary

| ID     | Title                                                                                                          | Severity             | Effort | Phase |
| ------ | -------------------------------------------------------------------------------------------------------------- | -------------------- | ------ | ----- |
| TD-01  | ✅ Unauthenticated delete endpoints and Server Actions                                                         | ~~🔴 Critical~~ done | M      | 1     |
| TD-02  | ✅ No input validation, incl. TD-02b's remaining boundaries                                                    | ~~🔴 Critical~~ done | M      | 1–2   |
| TD-03  | ✅ Test suite does not run                                                                                     | ~~🔴 Critical~~ done | M      | 1     |
| TD-04  | ✅ TypeScript errors on `tsc --noEmit`                                                                         | ~~🔴 Critical~~ done | S      | 1     |
| TD-05  | ✅ No ESLint config, no Prettier, no CI                                                                        | ~~🟠 High~~ done     | S      | 1     |
| TD-06  | ✅ Dead code and tutorial leftovers                                                                            | ~~🟠 High~~ done     | S      | 1     |
| TD-07  | ✅ `next`/`react` pinned; single lockfile                                                                      | ~~🟠 High~~ done     | S      | 1     |
| TD-08  | ✅ Metadata and query layer typed; zero `any`, rule is an error                                                | ~~🟠 High~~ done     | M      | 2     |
| TD-09  | ✅ Quartets collapsed into EntityList / EntityLibrary / EntityForm                                             | ~~🟠 High~~ done     | L      | 2     |
| TD-10  | ✅ Toasts (client) vs `logServerIssue` (server) replace the stub                                               | ~~🟠 High~~ done     | M      | 2     |
| TD-11  | ✅ Timestamps + `@@index([nome])`; relations still deferred                                                    | ~~🟡 Medium~~ part   | M      | 2     |
| TD-12  | ✅ Filter list declared once; count and rows can no longer diverge                                             | ~~🟡 Medium~~ done   | S      | 2     |
| TD-13  | ✅ Typed errors with `cause`; 404 vs 500; toasts via TD-10                                                     | ~~🟡 Medium~~ done   | M      | 2     |
| TD-14  | ✅ Map POIs persisted only to `localStorage`                                                                   | ~~🟡 Medium~~ done   | M      | 3     |
| TD-15  | ✅ `e2e/a11y.spec.ts` — zero axe violations, keyboard focus ring                                               | ~~🟡 Medium~~ done   | M      | 2     |
| TD-16  | ✅ Inconsistent formatting                                                                                     | ~~🟢 Low~~ done      | S      | 1     |
| TD-17  | ✅ README does not match reality                                                                               | ~~🟢 Low~~ done      | S      | 1     |
| TD-18  | ✅ `copy-webpack-plugin` forces webpack over Turbopack                                                         | ~~🟢 Low~~ done      | S      | 3     |
| TD-19  | ✅ Mixed Italian/English identifiers (residual set → TD-33)                                                    | ~~🟠 High~~ done     | L      | 2     |
| TD-20  | ✅ Every flag on, incl. `noUncheckedIndexedAccess` (`noUnusedLocals` rejected)                                 | ~~🟡 Medium~~ done   | M      | 2     |
| TD-21  | ✅ UI strings hardcoded; app must ship in it + en                                                              | ~~🟠 High~~ done     | L      | 2     |
| TD-22  | ✅ Lint warnings 293 → 0; every rule back to `error`                                                           | ~~🟠 High~~ done     | M      | 2     |
| TD-23  | ✅ Migration drift patched forward; migrations match the schema                                                | ~~🟠 High~~ done     | S      | 1     |
| TD-24  | ✅ Playwright harness + specs; `e2e` job blocking in CI                                                        | ~~🟠 High~~ done     | M      | 1     |
| TD-25  | ✅ Startup reachability check; 503 distinct from 500                                                           | ~~🟡 Medium~~ done   | S      | 2     |
| TD-26  | ✅ `sottoclassi` / `circolo` duplication resolved                                                              | ~~🟡 Medium~~ done   | S      | 2     |
| TD-27  | ✅ Hidden `classi=0` filter on the spells list removed                                                         | ~~🟠 High~~ done     | S      | 2     |
| TD-28  | ✅ Seed ids removed; the database assigns them, as the UI does                                                 | ~~🟠 High~~ done     | S      | 2     |
| TD-29  | ✅ Loading skeleton was the tutorial's invoices table                                                          | ~~🟡 Medium~~ done   | S      | 2     |
| TD-30  | ✅ Public list pages actually stream; skeleton matches the content                                             | ~~🟡 Medium~~ done   | S      | 2     |
| TD-31  | ✅ `sortSelectOptions` mutated shared `PageMeta.options` in place                                              | ~~🟡 Medium~~ done   | S      | 2     |
| TD-32  | ✅ E2E job spent 9m a run on `playwright install-deps`                                                         | ~~🟠 High~~ done     | S      | 1     |
| TD-33  | ✅ Italian identifiers TD-19 missed — 16 across 14 files + a directory                                         | ~~🟡 Medium~~ done   | S      | 2     |
| TD-34  | ✅ CI actions pinned to a deprecated Node 20 runtime; Node 22 → 24                                             | ~~🟢 Low~~ done      | S      | 2     |
| TD-35  | ✅ E2E specs assert hardcoded Italian copy instead of reading the catalogue                                    | ~~🟡 Medium~~ done   | M      | 2     |
| TD-36  | ✅ `proxy.ts` matcher let `.jpg` through the auth/i18n gate, breaking map tiles                                | ~~🟠 High~~ done     | S      | 2     |
| TD-37  | ✅ `authenticate()` and `app/lib/connections/**` are 0% covered — the login and DB-bootstrap path              | ~~🟠 High~~ done     | S      | 2     |
| TD-38  | ✅ `fetch*`/`get*Count` untested for deities, magicitems, npc — data layer at 51%, target 90%                  | ~~🟠 High~~ done     | S      | 2     |
| TD-39  | ✅ Pure functions in `app/lib/utils/**` at 51%, target 95% — cheapest real coverage in the project             | ~~🟡 Medium~~ done   | S      | 2     |
| TD-40  | ✅ Metadata correctness untested — `npcMeta`/`deityMeta` at 14%/25%, target 80%                                | ~~🟡 Medium~~ done   | S      | 2     |
| TD-41  | ✅ `app/lib/hooks/**` at 52%, target 70% — `useFilterController` entirely untested                             | ~~🟡 Medium~~ done   | S      | 2     |
| TD-42  | ✅ `app/ui/**` behaviour untested — domain forms/cards/libraries at ~0%, target 60%                            | ~~🟢 Low~~ done      | L      | 2     |
| TD-43  | ✅ `app/modules/maps/**` geometry and hooks near 0%, target 50%                                                | ~~🟢 Low~~ done      | M      | 2     |
| TD-44  | ✅ Re-measured coverage with `coverage.all: true`; re-scoped the 70% gap as TD-45/TD-46                        | ~~🟡 Medium~~ done   | S      | 2     |
| TD-45  | ✅ Page-level route components (`app/[locale]/dashboard/**`, `app/ui/geography`) covered                       | ~~🟡 Medium~~ done   | M      | 2     |
| TD-46  | ✅ `app/modules/maps/components/**` (Leaflet rendering, 737 lines) Vitest coverage — Tier 1 and Tier 2 done    | ~~🟡 Medium~~ done   | L      | 2     |
| TD-58  | ✅ Dependabot grouped a major ESLint bump into the dev-dependencies group, breaking CI                         | ~~🟠 High~~ done     | S      | 3     |
| TD-59  | ✅ `prisma` CLI and `@prisma/client`/`@prisma/adapter-pg` could bump independently, breaking the build         | ~~🟠 High~~ done     | S      | 3     |
| TD-61  | ✅ Option-backed `Int` fields accept any number; an out-of-list value renders as a blank cell                  | ~~🟠 High~~ done     | S      | 3     |
| TD-62  | ✅ POI category names are hardcoded English and reach the UI — a TD-21 leftover                                | ~~🟢 Low~~ done      | S      | 3     |
| TD-63  | ✅ Local dev DB's migration history had a gap `migrate dev`/`migrate deploy` couldn't get past                 | ~~🟡 Medium~~ done   | S      | 3     |
| TD-64  | ✅ `WorldMap.tsx`'s async-effect map-loading pattern trips `react-hooks/set-state-in-effect`                   | ~~🟢 Low~~ done      | S      | 3     |
| TD-65  | ✅ `DATABASE_URL` in this dev environment isn't a throwaway DB — e2e debris landed in real data                | ~~🟡 Medium~~ done   | S      | 3     |
| TD-66  | ✅ `UPLOAD_DIR`'s relative default silently splits map-image files from the DB rows referencing them           | ~~🟡 Medium~~ done   | S      | 3     |
| TD-67  | ✅ "Add to My Places" context-menu label is misleading — it creates any kind, not just a POI                   | ~~🟢 Low~~ done      | S      | 3     |
| TD-68  | ✅ `MapPOIPanel`'s Close button is unclickable — a same-`z-index` overlay intercepts the click                 | ~~🟠 High~~ done     | S      | 3     |
| TD-69  | ✅ `poi.linkedType`/`linkedId` has no unique constraint — a second pin per NPC/deity is silently possible      | ~~🟠 High~~ done     | S      | 3     |
| TD-70  | ✅ No rendering path exists for `deity`/`npc` pins on the map, even once positioned                            | ~~🟡 Medium~~ done   | M      | 3     |
| TD-71  | ✅ No way to position or edit a place that already exists — only newly-created ones get coordinates            | ~~🟠 High~~ done     | L      | 3     |
| TD-72  | ✅ `usePOIManager.ts`/`useNavigableChildren.ts` marker HTML uses inline `style`, not Tailwind classes          | ~~🟢 Low~~ done      | S      | 3     |
| TD-73  | ✅ `.env.test.example`'s documented e2e setup (`prisma db push`) leaves a fresh DB unable to seed              | ~~🟡 Medium~~ done   | S      | 3     |
| TD-74  | ✅ `pageMetaFields` spread four domain metas into one flat object — a name collision silently discarded one    | ~~🟡 Medium~~ done   | S      | 3     |
| TD-75  | ✅ `pnpm test` fails on a clean checkout — one suite needs a `DATABASE_URL` that only CI provides              | ~~🟡 Medium~~ done   | S      | 3     |
| TD-76  | ✅ `renderRichText` injects stored text as raw HTML with no sanitisation                                       | ~~🟡 Medium~~ done   | S      | 3     |
| TD-77  | ✅ An entity's location is resolved through two unreconciled read paths                                        | ~~🟡 Medium~~ done   | S      | 3     |
| TD-78  | ✅ The NPC admin list's Fazione header filters again, from the option bundle `EntityList` already resolved     | ~~🟢 Low~~ done      | M      | 3     |
| TD-79  | The unpositioned-places count doesn't distinguish "blocked on the parent's map" from any other cause           | 🟢 Low               | S      | 3     |
| TD-80  | ✅ Deity, magic-item, and faction create/update Server Actions lack unit and e2e test coverage                 | ~~🟡 Medium~~ done   | M      | 2     |
| TD-81  | ✅ Maps framed to the image's own aspect ratio instead of a square default                                     | ~~🟠 High~~ done     | M      | 4     |
| TD-82  | ✅ The place in view writes `?place=` on every hop; a reload reopens the same map, back leaves it              | ~~🟡 Medium~~ done   | S      | 4     |
| TD-83  | ✅ "Up" anchored to the map's own overlay container, not the scrolling page header                             | ~~🟠 High~~ done     | S      | 4     |
| TD-84  | ✅ `WorldMap` sized to its container (`h-full`) instead of the viewport                                        | ~~🟠 High~~ done     | S      | 4     |
| TD-85  | ✅ "Posiziona luogo" ships (PR #190); POI edit/delete reachable from SPEC-016's popover; list view kept        | ~~🟠 High~~ done     | M      | 4     |
| TD-86  | ✅ Renamed to "marker temporaneo", dismissable — ephemerality kept, by design                                  | ~~🟡 Medium~~ done   | S      | 4     |
| TD-87  | ✅ Zoom floor computed from the map's own bounds instead of a hardcoded 0                                      | ~~🟠 High~~ done     | S      | 4     |
| TD-88  | ✅ Sidebar scroll container added; sign-out and locale switcher reachable                                      | ~~🟠 High~~ done     | S      | 4     |
| TD-89  | ✅ `group` ancestor added; chevron rotates on all five disclosure cards                                        | ~~🟢 Low~~ done      | S      | 4     |
| TD-90  | ✅ Icon rotates in a square box now, not the wrapper — incl. two unreported instances found                    | ~~🟢 Low~~ done      | S      | 4     |
| TD-91  | ✅ Places and factions counted; every place in the tree, per the DM                                            | ~~🟡 Medium~~ done   | S      | 4     |
| TD-92  | ✅ Every card links to its domain list via the locale-aware `Link`                                             | ~~🟢 Low~~ done      | S      | 4     |
| TD-93  | ✅ Guarded writes refuse a second placement; un-placing and clearing are the way back                          | ~~🟠 High~~ done     | M      | 4     |
| TD-94  | ✅ Closed by SPEC-015 T7 — measurement rebuilt on the grid, haversine path deleted, regression test in place   | ~~🟠 High~~ done     | M      | 4     |
| TD-95  | ✅ POI panel + neighbours (`MapControls`, `MapLoadingSpinner`, `MapErrorBoundary`) swept into both catalogues  | ~~🟡 Medium~~ done   | S      | 4     |
| TD-96  | ✅ Both entries gone — "Copia coordinate" with PR #190, "Collega personaggio" with SPEC-016 T8                 | ~~🟢 Low~~ done      | S      | 4     |
| TD-97  | `MagicItemType`'s nine members are still Italian identifiers — a TD-33 miss                                    | 🟢 Low               | S      | 4     |
| TD-98  | ✅ Prettier no longer reaches other sessions' worktrees under `.claude/`                                       | ~~🟢 Low~~ done      | S      | 4     |
| TD-99  | A fresh worktree's `pnpm install` postinstall (`prisma generate`) fails for lack of `DATABASE_URL`             | 🟢 Low               | S      | 4     |
| TD-100 | ✅ The context menu closes on the DM's `dragstart`/`zoomstart`, not on every `movestart`                       | ~~🟡 Medium~~ done   | M      | 4     |
| TD-101 | ✅ Marker drag repositioning: the marker was under the panel, not undraggable; its e2e spec is real now        | ~~🟠 High~~ done     | M      | 4     |
| TD-102 | ✅ Landmarks route to `placeLandmark`; picking one no longer addresses whichever zone shares its id            | ~~🟠 High~~ done     | M      | 4     |
| TD-103 | ✅ "Posiziona luogo" was enabled from a tree-wide count while listing only the current map — a dead click      | ~~🟠 High~~ done     | S      | 4     |
| TD-104 | ✅ A zone has no edit surface: not renamable anywhere, and "Modifica area" is stranded in the right-click menu | ~~🟡 Medium~~ done   | M      | 4     |
| TD-105 | 48 `revalidatePath` calls name a route structure that does not exist — they work only as a refresh trigger     | 🟢 Low               | M      | 4     |
| TD-106 | ✅ A standing lint warning: the error boundary's "Vai alla home" leaves the page with a full document load     | ~~🟢 Low~~ done      | S      | 4     |
| TD-107 | ✅ "Vai alla home" in the map error boundary keeps the reader's locale                                         | ~~🟢 Low~~ done      | S      | 4     |
| TD-108 | ✅ A landmark created in this session had no numeric id, and `PlacePopover` converted it as though it did      | ~~🟡 Medium~~ done   | S      | 4     |
| TD-109 | ✅ The landmark popover's entity list has an e2e now — seen red on TD-108's bug before being trusted           | ~~🟢 Low~~ done      | S      | 4     |
| TD-110 | ✅ "Too many re-renders" was TD-108's `NaN` reaching Headless UI's `Listbox` — attributed, fixed by TD-108     | ~~🟡 Medium~~ done   | S      | 4     |
| TD-111 | ✅ A late POI load no longer overwrites a place just added, moved or deleted on the map                        | ~~🟡 Medium~~ done   | M      | 4     |
| TD-112 | `tailwind.config.ts` is never loaded — shimmer, blues and the forms plugin are missing                         | 🟡 Medium            | S      | 4     |
| TD-113 | Admin list pages show nothing on a phone — `hidden md:table` with no fallback                                  | 🟠 High              | M      | 4     |
| TD-114 | Pages are wider than a phone: fixed 900px form, non-wrapping list header, overflowing icon nav                 | 🟠 High              | M      | 4     |
| TD-115 | Dark mode is half there: map components follow the OS setting, the rest of the app does not                    | 🟡 Medium            | S      | 4     |
| TD-116 | Two page-title styles — `PageTitle` (Lusitana) vs `EntityForm`'s bold Inter heading                            | 🟢 Low               | S      | 4     |
| TD-117 | Two button components with different primary colours, plus eleven files of hand-rolled buttons                 | 🟢 Low               | M      | 4     |
| TD-118 | Public and admin lists of one domain look unrelated; admin rows are dominated by buttons                       | 🟢 Low               | M      | 4     |
| TD-119 | `/world` is a dead end once the world exists — no link to the map                                              | 🟢 Low               | S      | 4     |
| TD-120 | Form layout: all-caps labels, short description boxes, "Reset Filtri" in the Italian UI                        | 🟢 Low               | S      | 4     |
| TD-121 | The world map opens with the image at about half the canvas — seen once                                        | 🟢 Low               | S      | 4     |
| TD-122 | Create and update actions validate their input, then write the unvalidated copy                                | 🟠 High              | M      | 4     |
| TD-123 | `MapPOIPanel` still has 18 hardcoded English strings, including the confirm before deleting every landmark     | 🟠 High              | S      | 4     |
| TD-124 | Server-written error messages reach the Italian UI in English                                                  | 🟡 Medium            | M      | 4     |
| TD-125 | The four reorder actions accept duplicate ids, and a failed reorder says "Delete failed"                       | 🟡 Medium            | S      | 4     |
| TD-126 | Campaign forms stay on "saving" if a save throws, and most actions don't wrap database errors                  | 🟡 Medium            | S      | 4     |
| TD-127 | `WorldMap.tsx` is 1,329 lines and handles eight concerns                                                       | 🟡 Medium            | L      | 4     |
| TD-128 | `WorldMap`'s GeoJSON import skips the schema that `MapMain`'s import uses                                      | 🟢 Low               | S      | 4     |
| TD-129 | Map place and POI schemas restate field rules instead of using `zoneMeta`                                      | 🟢 Low               | S      | 4     |
| TD-130 | Validator helpers copied into five files                                                                       | 🟢 Low               | S      | 4     |
| TD-131 | Unused vendored map utilities still include Earth-geometry maths (ask before deleting)                         | 🟢 Low               | S      | 4     |
| TD-132 | Leftover inline styles and Italian comments                                                                    | 🟢 Low               | S      | 4     |
| TD-133 | The map has no keyboard path to create a place or open an existing one                                         | 🟠 High              | L      | 4     |
| TD-134 | Filter chips don't expose their pressed state                                                                  | 🟡 Medium            | S      | 4     |
| TD-135 | Result counts change without being announced                                                                   | 🟡 Medium            | S      | 4     |
| TD-136 | Admin row buttons all announce as "Modifica" / "Elimina"                                                       | 🟡 Medium            | S      | 4     |
| TD-137 | No `nav` landmark around the sidebar                                                                           | 🟢 Low               | S      | 4     |
| TD-138 | The overview skips from `h1` to `h3`                                                                           | 🟢 Low               | S      | 4     |
| TD-139 | Pagination doesn't mark the current page                                                                       | 🟢 Low               | S      | 4     |
| TD-140 | Delete wording differs between a place's trigger and its confirmation, and deleting a landmark asks nothing    | 🟡 Medium            | S      | 4     |
| TD-141 | English words left in Italian copy beyond TD-120                                                               | 🟢 Low               | S      | 4     |
| TD-142 | Title Case in Italian form titles and buttons                                                                  | 🟢 Low               | S      | 4     |
| TD-143 | NPCs are called "PNG" on the card and "Personaggi conosciuti" on the page it opens                             | 🟢 Low               | S      | 4     |
| TD-144 | `loot.checkOff.label` means different things in it and en                                                      | 🟢 Low               | S      | 4     |
| TD-145 | Shared error messages don't say what to do next                                                                | 🟢 Low               | S      | 4     |

---

---

## Closed items — TD-01 through TD-80

Everything the 2026-07-22 audit found, plus everything found while doing the work through 2026-08-17, is closed: correctness, security, dead code, formatting, CI, accessibility, the metadata-layer types, the identifier rename, the bilingual UI, the migration drift, the E2E harness, the coverage sweep that crossed Phase 2's 70% gate, the whole SPEC-004 map/world-tree run, the clean-checkout `pnpm test` gap, the metadata layer's unguarded field-name collision, description fields rendering as unsanitised HTML, the entity-location read path duplication, and the deity/magic-item/faction mutation coverage gap. The summary table above is the current status of each.

**Each item's full write-up — what was found, why, the fix — is in [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md)**, moved there in five passes (TD-01–TD-36 on 2026-08-01, TD-37–TD-75 on 2026-08-08, TD-76 on 2026-08-13, TD-77 on 2026-08-13, TD-80 on 2026-08-17). Nothing was deleted; the archive keeps every "(original)" problem framing exactly as recorded, per the policy in [`docs/README.md`](./README.md#keeping-them-honest).

---

## Open items

### TD-78 ✅ The NPC admin list lost its Fazione column filter when the field went table-backed — **DONE (2026-09-11)**

**Severity:** 🟢 Low · **Effort:** M · **Found:** 2026-08-10, while building [SPEC-006](./specs/006-factions.md) T7

Before SPEC-006, `npcMeta.faction` was a static option list, and the NPC admin
list's Fazione column got a working filter dropdown for free from
`SortableHeader`'s built-in mechanism (`fieldMeta[fieldKey].options`). T7
switched the field to `optionTable: "faction"` — rows in a table, not a static
list — and `SortableHeader` has no equivalent for that: it reads
`PageMeta.options` directly, which a table-backed field never declares. The
column degrades to sort-only rather than throwing (`isFiltrable: false`,
correct defensive behaviour), but that is a real capability the DM had before
this spec and does not have after it: filtering NPCs by faction from the admin
list header no longer works.

**Shipped (2026-09-11) — an S, not the M it was filed as: the premise was wrong.**
This was not `LocationFilterControl`'s shape. That picker cascades and fetches
client-side; faction is one flat list, and `EntityList` was already resolving
it once per request (`fetchFieldOptions("faction")`, SPEC-006 §7 decision 10)
for the cells and the edit form — the header just never received it.
`SortableHeader` now takes the same `optionBundle` and resolves a filter's
options in the order `resolveFieldValue` and `InputComponent` already use
(`optionTable` from the bundle, else static `options`), and the column's
`isFiltrable: false` is gone from `listConfig`. The query side needed nothing:
`faction` was always in the NPC page's `pagesConfig`, so `?faction=<id>`
narrowed through `getQuery` all along. No "no faction" filter option — `getQuery`
has no `IS NULL` equality and nobody asked. Covered by `SortableHeader.test.tsx`
and `EntityList.test.tsx` (both red without the fix) and `e2e/npc-list.spec.ts`.

**Reach:** only `npc.faction` is both table-backed and a list column. The other
`optionTable` fields — SPEC-013's scene, scene-creature and loot fields
(`zone`, `npc`, `magicitems`, `treasure`) — sit outside the list pages
(ADR-0011) and have no header. A future table-backed column gets the filter by
declaring `optionTable`, as long as `EntityList` puts its table in the bundle —
that resolution is still NPC-only.

**Same shape as SPEC-008's "Location" column**, which needed its own bespoke
`LocationFilterControl` for exactly this reason — a dynamic, async-resolved
list `SortableHeader`'s static shape can't express. A real fix here is that
same size of work: a `FactionFilterControl` (or a generalisation of
`LocationFilterControl`) fed by `fetchFieldOptions("faction")`.

**Not filed as a blocker.** Nothing in SPEC-006's user stories asked for
faction filtering on the admin list, and building it without being asked is
exactly what SPEC-006 §3 and its own §9 open question 2 warn against. Pick
this up if the DM asks for it back, not before.

### TD-79 — The unpositioned-places count doesn't distinguish "blocked on the parent's map" from any other cause

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-08-10, [SPEC-007](./specs/007-placement-backlog.md) T2 — filed 2026-08-17 during the Phase 3 closure audit, since it had only ever been recorded as prose in `ROADMAP.md`, with no number of its own

`countUnpositionedPlaces` (`app/lib/data/maps/countUnpositionedPlaces.ts`) reports
one tree-wide number: every place with `lat: null` and a non-null `parentId`
— plus, since SPEC-017 T7 (2026-09-05), every landmark with `lat: null`, which
does not change anything this item argues. A
place whose own parent has no map yet — so it structurally cannot be
positioned until the DM uploads a map one level up — counts identically to a
place whose parent already has a map and simply hasn't been drawn on it yet.
The two situations have different fixes (upload a map vs. draw a pin), and
the count cannot tell the DM which one they're looking at.

**Re-scoped 2026-08-18 — and the alarming version of this entry was wrong.**

An earlier draft of this note argued that removing the header count would strand
places whose parent has no map: nothing would list them, because the
"Posiziona luogo" dropdown can only offer the children of the map currently open.
**The DM refuted it, and checking the code confirms the refutation.** A place can
only be created by right-clicking a map — `createPlace`'s only callers are
`WorldMap` and `MapPOIPanel`, there is no admin CRUD for places, and there is no
seed — and a place with no `mapImage` is not navigable
(`useNavigableChildren.ts:228`), so there is no map to right-click _inside_ a
mapless place. A map also cannot be removed once uploaded: `updateZoneMap` only
ever writes a non-empty `mapImage`, never null. **So a child of a mapless parent
is not reachable through today's UI, and the category this item was created to
distinguish is currently empty.**

Recorded at this length because the mistake is instructive and this register has
made it before (SPEC-007 §0 documents two consecutive drafts that reasoned from a
spec's description of the data instead of the data): **the reasoning was sound
and the premise was never checked.**

**What the DM asked for instead, and it is the whole of it:** the count belongs
next to the "Posiziona luogo" entry in the right-click menu — how many places
are still waiting, shown at the exact moment the DM can act on it — and nowhere
else. That is a line of TD-85's work, not a separate item.

**Keep this entry open anyway, narrowed to a guard.** The empty category stops
being empty the moment anything lets a map be deleted or a place be created away
from a map — both plausible (the map options menu already offers "replace", and
an admin list for places would be a natural addition). If either ships, the
distinction this item is about becomes real and invisible at the same time.
Whoever builds one should read this first.

**Why this is Low, not Medium.** `MapUploadControl` (SPEC-007 T1) already
surfaces the fix in practice: the moment the DM reaches the mapless parent,
the upload control is right there. The gap is in the report's wording, not
in the workflow — the number is honest, just less specific than it could be.

**The fix, sketched in SPEC-007 §10 T2's own note:** split the count (or add
a second one) that distinguishes "blocked on an ancestor's missing map" from
"map exists, not yet drawn." Doing this precisely means walking each
unpositioned place's `parentId` chain to check whether any ancestor also
lacks a map — not a single-query `WHERE` clause — so it is a real, if small,
piece of work, not a one-line change.

### TD-82 ✅ The place in view has no URL of its own — navigating the tree never changes the address bar — **DONE (2026-09-10)**

**Severity:** 🟡 Medium · **Effort:** S · **Found:** 2026-08-17, requested by the DM

`/dashboard/geography` renders whichever place sits on top of
`GeographyExplorer`'s in-memory stack. Descending into a child pushes, "up"
pops, and **the URL is identical throughout** — so a specific map cannot be
linked, bookmarked, reopened after a refresh, or reached with the browser's
back button.

**Half of this already exists and is easy to miss.** `geography/page.tsx`
already accepts `?place=<id>` and calls `fetchPlaceAncestryChain` to seed the
stack with that place's full root-to-place trail (SPEC-011 T4, built for
cross-entity place search). The read path is done, tested, and already handles
a missing, non-numeric, or dangling id by falling back to the root. **What is
missing is only the write half:** `handleDescend`/`handleAscend` never tell the
router where they went.

**The fix, in shape:** on descend and ascend, `router.replace` the same page
with `?place=<current.id>` (`replace`, not `push`, unless we decide each hop
should be its own history entry — see below). Nothing else has to change: a
reload of that URL rebuilds the identical stack through the path that already
works.

**Deliberately not `/dashboard/geography/01`,** which is how the request was
phrased. A path segment means a new dynamic route and a second copy of the
page's data loading, for no behaviour the query param does not already give
us — and the id in the URL would be the database id either way, not a stable
human-facing number. If the DM wants pretty, memorable per-map URLs (slugs
rather than ids), that is a genuine feature and needs a spec under
`docs/specs/`, not this entry.

**Decide while implementing:** whether the browser back button should walk the
tree hop by hop (`push`) or leave the map entirely (`replace`). `push` is
probably what the DM means by "poter navigare", but it makes back and the "up"
button do subtly different things — back retraces _history_, up climbs the
_tree_, and after a search-result deep link those two are not the same path.

**Shipped (2026-09-10) — `replace`, by the DM's choice.** Back leaves the map rather than walking it; "up" is the only way to climb the tree, so history and tree never have to agree. `GeographyExplorer` syncs the URL from the top of its stack in one effect, with `window.history.replaceState` — which Next 16 integrates with its router without a server round trip — rather than `router.replace`, which would refetch the page's server component, and its three queries, on every hop. The root carries no param, which also clears a garbage or dangling `?place=` the page fell back from. Covered by six unit tests in `GeographyExplorer.test.tsx` (five seen red without the effect; the sixth guards a deep link's param against being overwritten, so it passes either way) and by `e2e/map-place-url.spec.ts`, which descends, reloads onto the same map, climbs back, and asserts that back leaves the map — the assertion that tells `replace` from `push`.

**`push` was weighed and rejected** (recorded in `CLAUDE.md`'s decisions). It needs the stack rebuilt from the URL on `popstate`, including places no longer in it — back after "up", forward after back — and `fetchPlaceAncestryChain` is server-only, so it would mean a new read-side Server Action or a cache of popped entries. Revisit only if the DM asks for back to retrace hops, and then as a spec.

### TD-97 ✅ `MagicItemType`'s nine members are still Italian identifiers — a TD-33 miss — **DONE (2026-09-17)**

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-08-18, while writing SPEC-013 T3's `TreasureCategory`

`app/lib/definitions/enums/magicitem/MagicItemType.ts` — `Anello`, `Armatura`,
`Arma`, `Bacchetta`, `Bastone`, `OggettoMeraviglioso`, `Pergamena`, `Pozione`,
`Verga` — is Italian identifiers in the code layer, which `CLAUDE.md`'s
language conventions say is a genuine TD-33 miss, not an exception. Not a new
finding in the sense of unnoticed: T3's `TreasureCategory` was deliberately
built to copy this file's _structural_ pattern (enum + numeric options array)
while using English members, precisely to avoid extending the miss.

**Resolution:** renamed the nine members to English —
`Ring`, `Armor`, `Weapon`, `Wand`, `Staff`, `WondrousItem`, `Scroll`, `Potion`,
`Rod` — matching `TreasureCategory`'s exact naming shape (member name equals
its string value, no space in `WondrousItem`). Checked first whether the
stored values would change: `magicitems.type` is a Prisma `Int` (`@map("tipo")`),
populated from the numeric `value` in
`app/lib/config/magicitem/item-types.ts`, never from this enum's string —
`MagicItemType` is a code-layer tag only, not a catalogue key and not
persisted, so this is a pure rename with no `@map`, no migration and no data
risk. `item-types.ts` (the only other consumer) and a stale comment in
`TreasureCategory.ts` were updated to match. `pnpm typecheck`, `pnpm lint` and
the full `pnpm test` (2109/2109) all pass unchanged.

### TD-98 ✅ `.prettierignore` doesn't exclude `.claude/`, so `format:check`/`--write` reach other sessions' worktrees — **DONE (2026-09-11)**

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-08-18, running several worktree agents in parallel

`.claude/worktrees/**` holds other agents' in-progress git worktrees while
they're mid-task. `.prettierignore` lists `node_modules`, `.next`, `generated`,
`coverage`, `public`, `playwright-report`, the lockfiles and `next-env.d.ts` —
not `.claude/`. `pnpm format:check` scanning the whole repo therefore walks
into other worktrees and reports their files; harmless for a read-only check,
but `prettier --write .` run from the repo root would edit another session's
working tree out from under it.

**The fix:** add `.claude/` to `.prettierignore`, and check whether
`tailwind.config.ts`'s content glob and ESLint's ignore list have the same gap
— found while debugging TD-85/96's CI failures, where several worktrees were
live at once.

**What shipped.** `.claude/` is in `.prettierignore`, with a comment saying
why. The audit the fix asked for, checked rather than read off the configs:

| tool     | reaches `.claude/`? | why                                                                                             |
| -------- | ------------------- | ----------------------------------------------------------------------------------------------- |
| Prettier | **did** — now fixed | `getFileInfo` returned `ignored: false` for a file under `.claude/worktrees/`                   |
| ESLint   | no                  | `eslint.config.mjs` already ignores `.claude/**`, with a comment                                |
| Vitest   | no                  | `vitest.config.ts` already excludes `**/.claude/**`, with a comment                             |
| Tailwind | no                  | its `content` globs are anchored at `./app`, `./pages`, `./components`                          |
| tsc      | no                  | `tsc --listFilesOnly` lists 0 files there: TypeScript's `**` skips directories named with a `.` |

`prettierignore.test.ts` asks Prettier's own `getFileInfo` whether a worktree
path is ignored (and that `app/` still is not); it was red before the line was
added. `.claude/launch.json`, the one tracked file under `.claude/`, is now
outside Prettier's reach too — as it already was outside ESLint's.

### TD-99 ✅ A fresh worktree's `pnpm install` postinstall (`prisma generate`) fails for lack of `DATABASE_URL` — **DONE (2026-09-17)**

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-08-18/19, across every worktree agent this session

`pnpm install --frozen-lockfile` in a freshly created git worktree has no
`.env`, and `prisma generate`'s postinstall wants a `DATABASE_URL` to read
even though generation itself needs no live database connection. Every
worktree agent this session hit this and worked around it by generating once
against `.env.example`'s placeholder connection string, undocumented, ad hoc,
independently discovered each time.

**Resolution:** not the same mechanism as TD-75. `app/lib/config/env.ts`
(TD-75's culprit) is app code — `prisma generate` never imports it. The actual
cause is `prisma.config.ts` itself: it built its `datasource.url` with
`prisma/config`'s `env("DATABASE_URL")` helper, which throws
`PrismaConfigEnvError` the moment the CLI _loads_ the config file, before any
command runs — reproduced with `env -u DATABASE_URL pnpm exec prisma generate`
→ `Failed to load config file ... Cannot resolve environment variable:
DATABASE_URL`. Fixed in shape: `prisma.config.ts` now reads
`process.env.DATABASE_URL` directly and falls back to the same placeholder
connection string `vitest.config.ts`/CI already use for TD-75
(`postgresql://admin:postgres@localhost:5432/placeholder`) when it's unset.
`prisma generate` needs no live connection so the placeholder is enough; a
command that does need the database (`migrate`, `db push`, `db seed`,
`studio`) still fails on a genuinely missing `DATABASE_URL` — now with a
normal Postgres connection/auth error instead of a config-load error, verified
with `pnpm exec prisma migrate status`. Verified `env -u DATABASE_URL pnpm
install --frozen-lockfile` succeeds end to end with no `.env` present. No
`docs/TESTING.md` workaround note needed since the bug is fixed rather than
documented.

### TD-100 ✅ The map context menu can die to the init tail on slow environments; `map.spec` raced it and lost on CI — **DONE (2026-08-31)**

**Severity:** 🟡 Medium · **Effort:** M · **Found:** 2026-08-21, from a docs-only PR (#215) failing e2e twice on the same test

`map.spec.ts`'s "clicking the visible Close button closes the desktop POI
panel" failed on CI twice in a row (runs of 2026-08-20, PR #215 — a PR that
touches only two markdown files) while the identical code was green on main
and green locally across the full suite, `--repeat-each` isolation, 6×/20×
CPU throttling, and 500ms emulated network latency. The Playwright trace and
error context from CI show two distinct signatures, both of them the test
racing the map's initialisation window:

- **First attempt:** the right-click opened the menu, the "Aggiungi luogo"
  button resolved, then detached from the DOM once (~100–200ms after opening,
  the same offset TD-90's/#208's cascade note records) and never returned —
  the menu closed and the test never right-clicks again.
- **Both retries:** the right-click completed but the menu never appeared at
  all within 30s — consistent with the click landing before Leaflet's
  `contextmenu` handler was attached, since `.leaflet-container` being
  visible (all the `beforeEach` waits for) is not "the map is ready".

**What was ruled out, with evidence:** the six mount-time server-action POSTs
to `/dashboard/geography` (one per data-fetching hook) carry ~68-byte
responses on CI and 843 bytes locally — return values only, no RSC re-render
payload, so they cannot remount anything (Next 16's server-actions guide
confirms an action that neither revalidates nor touches cookies does not
re-render). The #208 framing fix (`{ animate: false }` inside
`runWithoutClosing`, both the interim `setView` and the image-load re-fit) is
intact and covers what it says it covers.

**The suspected closer for the first signature** is the deferred
`map.invalidateSize()` in `LeafletMap.tsx` (~line 123, rAF + 100ms after map
creation): if the container's size changed in that window (late layout/font
settle — CI-plausible, local-implausible), `invalidateSize` fires `moveend`,
and `setMaxBounds`'s `panInsideMaxBounds` hook — attached by the interim
framing — pans on `moveend`, and _that_ pan fires the `movestart` that
closes the menu. Same cascade #208 documented, different trigger, and this
one runs outside any `runWithoutClosing`. Unproven: the interleaving did not
reproduce locally under any throttle tried.

**Interim measure, shipped with this entry:** `map.spec.ts` now opens the
context menu through a retrying helper (`openContextMenu`) — right-click
until the menu is visible, as a real DM would — instead of right-clicking
exactly once and waiting 30s. This unhostages CI without masking a
persistent regression (if the menu keeps dying, the retry exhausts and the
test still fails), but it deliberately does not fix the app.

**That interim was too narrow, and CI proved it on 2026-08-27** (run
33113909995, PR #230 — again a PR that changes nothing this test touches).
`openContextMenu` returned as soon as the menu was _visible_, which leaves
the window between "visible" and "the item is clicked" unguarded — and the
second signature above landed squarely in it: the menu opened, "Aggiungi
luogo" resolved, then went unstable and detached mid-click, three attempts
running. Retrying the open cannot recover from that, because by then the
helper has already returned. The helper has therefore moved to
`e2e/helpers/mapContextMenu.ts` and gained `chooseFromContextMenu`, which
retries the right-click _and_ the click on the entry as one unit; all six map
specs plus `a11y.spec.ts` go through it, where before only `map.spec.ts` had
any retry at all and the other nine right-click sites had none. Still an
interim, and still not a fix to the app.

**Decided and shipped (2026-08-31): the menu closes on `dragstart` and
`zoomstart`, never on `movestart`.** Of the two options this entry left open,
the user-intent one was taken; neutralising the deferred `invalidateSize` was
not, because it only removes the trigger this entry happened to find, and the
next programmatic move would reopen the same class. `useMapContextMenu` now
attaches one handler to those two events instead of to `movestart`.

**Why those two events are the right line, verified against Leaflet's own
source** (`node_modules/leaflet/dist/leaflet-src.js`) rather than assumed:

- Map-level `dragstart` is fired from `Map.Drag._onDragStart` alone — a real
  pointer drag, mouse or touch. No app call produces it. So every
  programmatic pan, including this entry's `invalidateSize` → `moveend` →
  `panInsideMaxBounds` cascade, is now invisible to the menu, and so is any
  future one.
- `zoomstart` is fired from `Map._moveStart(zoomChanged)`, which runs for the
  DM's wheel/pinch/`+`/`-` **and** for a programmatic `setView`/`fitBounds`
  that changes the zoom. It cannot tell them apart on its own, so
  `runWithoutClosing` stays exactly as load-bearing as before — it is what
  marks `WorldMap`'s two camera moves as the app's.

**`animate: false` on those two moves is still load-bearing, for a new
reason,** and the comments in `WorldMap.tsx` that gave the old one were
corrected with this change: `_tryAnimatedZoom` defers an animated zoom's
`_moveStart` into a `requestAnimFrame`, so an animated re-fit would fire its
`zoomstart` _after_ `runWithoutClosing`'s synchronous window had closed. The
old comments explained the flag in terms of the deferred `moveend` and the
max-bounds pan; that cascade still happens, the menu just no longer listens
to it.

**One behaviour narrowed, knowingly:** Leaflet's keyboard pan (arrow keys →
`map.panBy`) fires neither event, so it now leaves the menu open where it
used to close it. Its zoom keys still close it, as does a click anywhere on
the map or Escape. Recorded in the handler's comment; if it ever bites, the
fix is an explicit key handler, not a return to `movestart`.

**Tests.** `useMapContextMenu.test.ts` gained the regression this turns on —
a bare `movestart`, wrapped or not, leaves the menu open — plus one test per
user-intent event; the `runWithoutClosing` pair now drives `zoomstart`, which
is the event they actually guard. Those run against a fake map, so
`map.spec.ts` covers the half only a browser can: a real mouse drag closes
the menu.

**The e2e retry helpers stay.** `e2e/helpers/mapContextMenu.ts` answers two
signatures and this fixes one of them — a right-click that lands before
Leaflet has attached its `contextmenu` handler still opens nothing, and only
clicking again can help that. Its header now says which half is fixed in the
app and why the retries remain.

The DM-facing claim this preserves: a menu the DM opened stays open until the
DM closes it or acts on it.

### TD-103 ✅ "Posiziona luogo" is enabled from a tree-wide count but lists only the current map's children — **DONE (2026-08-30)**

**Severity:** 🟠 High · **Effort:** S · **Found:** 2026-08-30, by the DM using the app while TD-102 was open — "clicco e non succede nulla"

`MapContextMenu`'s entry was `disabled={unpositionedCount === 0}`, and
`countUnpositionedPlaces` counts every `zone` with `lat: null` **in the whole
tree**. Its dropdown, meanwhile, was filled from `unplacedPlaces` —
`useUnplacedChildren(parentId)`, the direct children of the map currently
open. So on any map whose own children are all placed, the entry rendered
enabled, the click toggled `isPositionListOpen`, and
`isPositionListOpen && unplacedPlaces.length > 0` rendered nothing. A control
that looks available and does nothing at all.

Live on the DM's own database while this was found: 41 unpositioned zones
tree-wide, so the entry was enabled on **every** map, and useful on the two
that actually had unplaced children.

**Neither half was wrong on its own.** SPEC-007 §5 says outright that the
count is "a tree-wide read, not a per-parent one" and that
`useUnplacedChildren` "answers which children of _this_ place lack
coordinates and stays as it is" — two numbers for two surfaces, deliberately.
The header label that consumed the tree-wide one was withdrawn on 2026-08-18
("a number with no action attached to it is noise"), and the same
conversation gave positioning its own right-click entry (TD-85). That is
where the count got wired to `disabled`: an awareness figure asked to answer
a reachability question.

**Fix:** the entry is enabled from the list it will actually show. The
tree-wide number still reaches the menu, but only as `positionPlaceSublabel`'s
already-rendered text — information about the campaign, never a claim about
this map — so `MapContextMenu` no longer takes `unpositionedCount` at all.

**Why the tests did not catch it:** every case in
`MapContextMenu.test.tsx` paired `unplacedPlaces: []` with
`unpositionedCount: 0` and a populated list with `unpositionedCount: 2`. The
suite encoded the assumption that the two agree, so the one state that
matters — non-zero count, empty list — was never rendered. It has its own
test now.

**Interim, and labelled as such.** The DM's own reading of this is that the
unplaced pool should not be per-map at all: there is no way to move a place
from one map to another, so a place parked under the wrong parent is stuck
there. That is re-parenting, cycle refusal and ADR-0010's entity invariant —
recorded in [`ROADMAP.md`](./ROADMAP.md) as spec work. This item only stops
the control from lying; it does not decide what the pool should contain.

> **The interim ended on 2026-09-09** with
> [SPEC-017](./specs/017-one-unplaced-pool.md): the pool is one list across
> every map, so the entry's enabled state and its contents finally answer the
> same question about the same set — bar a map's own ancestors, left out
> because placing one there would break the tree (T5/T9). The tree-wide number
> in the sublabel keeps the framing this item chose for it: information about
> the campaign, never a claim about this map. The fix here stands unchanged;
> what changed is that the two numbers now describe one pool.

### TD-104 ✅ A zone has no edit surface: not renamable anywhere, and "Modifica area" is stranded in the right-click menu — **DONE (2026-08-30)**

**Severity:** 🟡 Medium · **Effort:** M · **Found:** 2026-08-30, by the DM clicking a zone with a sub-map and looking for "Modifica area" where the other actions are

Left-clicking a navigable child opens `PlacePopover`, which offers exactly
four things: attach an entity, "Sposta nei luoghi non posizionati" (SPEC-016
T5), "Rimuovi definitivamente" (T6), and "Apri mappa". **No edit of any
kind.** A landmark, by contrast, has "Modifica" from the same popover (T7).
Editing a zone's area lives only in the map's right-click menu, reached by
right-clicking inside the area rather than by clicking the place — which is
where the DM looked and did not find it.

**And the gap is wider than the missing entry.** Grepping every writer of
`zone` turns up `createPlace`, `createRootPlace`, `updateZoneMap`,
`updateZoneGrid`, `updateZonePosition`, `unplacePlace` and `deletePlace`.
None of them writes `title` or `description`. **A region cannot be renamed
anywhere in the application.** `MapOptionsButton` acts on the place currently
being viewed and offers only replace-map, configure-grid and delete.

So this is one decision, not two: if the popover gains an edit surface for
zones it should be a single entry that covers the title, the description and
the area, rather than "Modifica area" moved across on its own and a rename
bolted on later.

**Decided by the DM, 2026-08-30: one "Modifica" entry, opening the panel with
the area inside it.** Not two entries side by side in the popover. So the
popover gains exactly one button for a zone, matching the shape a landmark
already has (SPEC-016 T7's "Modifica"), and the area's redraw is reached from
within that panel rather than from a second place. What the right-click menu
keeps is a separate question this does not settle — the positional entry still
works on the area under the cursor, which is the only way to reach an area
whose place is hard to click. The area half also changes shape in the move — the
right-click entry targets `contextMenuOverArea`, the area the click landed
inside, while a popover entry targets the place already clicked; both end up
arming `editingArea`, so the gesture itself is unaffected.

**The sublabel outlived its entry by one commit.** It first said
"Ridimensiona o sposta" / "Resize or move" while `handleEditArea` armed only
SPEC-009 T5's redraw-to-replace. Redrawing the rectangle elsewhere does move
the area, so the wording was not false about the outcome — but it promised a
_control_ that does not exist, and the DM read it that way. It was corrected
to "Ridisegna il rettangolo" / "Redraw the rectangle", then dropped when the
popover gained its entry, and then the whole menu item went with it.

#### What landed (2026-08-30)

- **`zoneMeta`** (`app/lib/config/geography/zoneMeta.ts`) — the `PageMeta`
  for `title` and `description` that did not exist. Follows `zoneGridMeta`'s
  ADR-0011 precedent exactly: outside the metadata layer's page composition,
  declared all the same so the panel and the mutation share one validator
  and one label key each.
- **`updateZoneDetails`** — the missing mutation. A whole-form save rather
  than `updatePoi`'s partial spread, because the form has no way to express
  what an omitted key would mean. A region is renamable now.
- **`ZoneEditPanel`** (`app/ui/geography/`) — name, description and area in
  one panel, modelled on `MapGridConfigPanel`, not on `MapPOIPanel`.
  Extending the latter was the expected route and was rejected on reading
  it: its form is hardcoded English throughout (against CLAUDE.md's
  bilingual rule), its `editTarget` is a `POI` whose id is a `string` where
  a zone's is a `number`, its save path returns before `kind` is read, and
  `MapMain.tsx` is a second vendored consumer that any new required prop
  would break.
- **The popover** gains one "Modifica" for a zone, per the DM's decision —
  shown for every zone, not only an area, since the name and description are
  the half that had no edit surface at all and a point-placed place has
  those too.
- **Redrawing saves first.** The area half needs the modal gone, so the
  button commits the text and only then re-arms `editingArea` through a
  shared `armAreaRedraw` — the same SPEC-009 T5 commit path the right-click
  menu has always used, now reached with the clicked place as its target
  instead of `contextMenuOverArea`.
- **A point-placed place** gets the area control disabled with a reason
  rather than absent. Drawing a first rectangle onto a point would convert
  it into an area — a different operation, which `updateZonePosition` would
  accept and nobody has specified.

#### And the right-click entry is gone (the DM, 2026-08-30)

Asked as an open question when the popover entry landed, and answered
straight after: **remove it.** `onEditArea`, `showEditArea` and
`editAreaLabel` are gone from `MapContextMenu`'s props, `handleEditArea` is
gone from `WorldMap`, and the `geography.editArea` namespace is deleted from
both catalogues. `armAreaRedraw` survives with one caller instead of two.

**The cost was named and accepted, so record it rather than rediscover it.**
The right-click entry was the only way to reach an area whose _place_ is
awkward to click — under a panel, off-screen, or beneath another marker —
because it targeted the area the cursor was inside rather than a place you
had to hit. Nothing replaces that. If it turns out to bite on the DM's real
map, the fix is to restore a deliberate entry point, not to treat the
removal as a regression: it was a choice between one edit surface and two,
and one won.

`contextMenuOverArea` stays — it still drives `hideAddPlace`, SPEC-009 T4's
containment rule, which is a separate concern from editing.

The five SPEC-009 T5 tests in `WorldMap.test.tsx` that armed the gesture
through the menu now arm it through the popover and panel. They were
rewired, not deleted: the gesture, the `useDrawArea` instance and the
`updateZonePosition` commit are all unchanged — only the way in moved.

### TD-105 — 48 `revalidatePath` calls name a route structure that does not exist, and nothing is cached anyway

**Severity:** 🟢 Low · **Effort:** M (was S — see the correction) · **Found:** 2026-08-30, noticed while writing `placeLandmark` for TD-102 — `createPoi`/`updatePoi` revalidate `/geography` where every zone mutation revalidates `/dashboard/geography`

> **Corrected 2026-09-11 — the calls are not inert, and deleting them would be
> a regression.** Finding 2 below holds: there is no server cache. The
> conclusion drawn from it does not. Read in Next 16.3's source, not inferred:
>
> - `revalidatePath` sets `workStore.pathWasRevalidated` **whatever the path
>   names** — `server/web/spec-extension/revalidate.js` carries the line
>   `// TODO: only revalidate if the path matches`.
> - `server/app-render/action-handler.js` skips rendering the page after a
>   Server Action unless that flag is set ("If the page was not revalidated
>   … we can skip rendering the page"). The flag is what makes the action's
>   response carry a fresh render of the page the reader is on; its
>   `x-action-revalidated` header is what makes the client evict its prefetch
>   cache (`client/.../server-action-reducer.js`).
> - So each call is why the page updates in place after a mutation that does
>   not redirect — the map's place/unplace flows, the inline collections. A
>   nonsense path behaves identically, which is all the
>   `/td-105-nonsense-path` probe below showed; no call was ever removed. The
>   prediction, for anyone who wants it empirical: delete the call from
>   `unplacePlace` and `map-unplace.spec`'s count assertion should go red.
>
> **The choice is not delete-or-correct but how to keep the refresh:**
>
> - **`refresh()` from `next/cache`** (new in Next 16) sets
>   `ActionDidRevalidateDynamicOnly` — it says exactly what these calls do
>   today. The one difference: the client evicts its prefetch cache only on
>   `ActionDidRevalidateStaticAndDynamic`, which is what `revalidatePath`
>   sets. Whether that changes back/forward is the "one thing still
>   unverified" below, and it is now the question that decides. Changing the
>   pattern for every mutation wants an ADR first.
> - **Correct the paths** —
>   `revalidatePath("/[locale]/dashboard/<domain>", "page")`: identical
>   behaviour today and right if a cache ever arrives, but
>   still a call named for a cache invalidation whose effect is a refresh.
> - **Deleting is out.** The paragraphs below that recommend it are kept as
>   the original analysis, not as advice.
>
> Effort revised S → M: an ADR, a browser check against a production build,
> and ~50 call sites plus their test mocks — the substitution itself is
> mechanical and does not need Opus.
>
> **Sequencing, noted 2026-09-11:** SPEC-018 T2 moves every dashboard page
> under `app/[locale]/dashboard/[system]/`, so the corrected-path option would
> become `revalidatePath("/[locale]/dashboard/[system]/<domain>", "page")` — one
> more dynamic segment on every call. `refresh()` names no route and is
> unaffected. Decide this after T2 part A lands, or take `refresh()`.

**Two findings, and the second defuses the first.**

**1. None of the 48 calls is in a form that can match.** Pages live at
`app/[locale]/dashboard/<domain>`, so the path begins with a dynamic segment.
Next's own reference
(`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md`)
settles it on two points: with rewrites you pass the **destination** path, not
the URL the browser shows, because the function works on the route file
structure; and when the path contains a dynamic segment, `type` is
**required**. `proxy.ts` mounts `next-intl/middleware` with
`localePrefix: "as-needed"`, so `/dashboard/geography` is the source URL,
rewritten internally to `/it/dashboard/geography`. The form that would match
is `revalidatePath("/[locale]/dashboard/geography", "page")`.

| form                              | calls | what is wrong                                               |
| --------------------------------- | ----- | ----------------------------------------------------------- |
| `/dashboard/campaign` and similar | 29    | the _source_ path — the reference's own "Incorrect" example |
| `/geography`, `/npc`, `/spells`…  | 19    | matches nothing: neither source nor destination             |
| passing `type: "page"`            | 0     | required by the `[locale]` segment, never passed            |

**2. There is no cache for them to invalidate.** Verified against a production
build on 2026-08-30, not inferred:

- `pnpm build` marks **every** route `ƒ (Dynamic) server-rendered on demand`.
  The only `○ (Static)` entry in the whole table is `/opengraph-image.png`.
  That follows from the code: every dashboard page reaches `requireSession()`
  → `auth()` → cookies, which forces dynamic rendering.
- Against `pnpm start`, the page's own response carries
  `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`.
- Inserting an unplaced zone **directly into the database**, with no mutation
  and no `revalidatePath` anywhere in the picture, moved the rendered
  `unpositionedCount` from 0 to 1 on the very next request, and deleting it
  moved it back. The page reads the database per request.
- The client Router Cache does not hold these either: `staleTimes.dynamic`
  defaults to 0 seconds since Next 15 ("not cached"), and `next.config.ts`
  sets no `staleTimes`.

**So this is not the landmine the first draft of this entry described.** The
worry was that all 48 work by side effect — the reference notes that a Server
Function's `revalidatePath` currently also refreshes previously visited pages,
and says that will be narrowed — and would stop together when Next narrows it.
They will not, because nothing here is cached to begin with. Correcting the
paths would change nothing observable.

_(Superseded 2026-09-11 — deleting them would stop the in-place refresh; see
the correction at the top of this entry.)_ **The fix is therefore to delete
them, or to correct them, and the argument runs the other way than expected.** Deleting is honest about today: 48 calls
that do nothing, one of them (`/geography`) visibly a different kind of
nothing from the rest, is a standing invitation to misread the caching model —
this entry exists because it did. Correcting is the bet that caching arrives
later (PPR, `use cache`, a static shell), and 48 calls that are wrong now
would be equally wrong then, so keeping them "for later" buys nothing.

**One thing still unverified**, and it is the only reason not to delete them
outright without looking: whether any client-side navigation currently leans
on that temporary broad refresh — back/forward in particular, since the
reference notes `staleTimes` does not govern back/forward caching. Checking
that needs a browser session against a production build, which the
curl-and-cookie probe above deliberately did not cover.

**A claim in the code was wrong and was corrected with this entry.** Comments
in `WorldMap.tsx` and `WorldMap.test.tsx` said the count refresh comes from
`revalidatePath("/dashboard/geography")`, "confirmed live in e2e (SPEC-016
T5)". The observation was real; the attribution was not, and e2e could never
have supported it — `playwright.config.ts` starts `pnpm dev`, where Server
Components re-render per request whatever the cache is told. Pointing
`unplacePlace` at `revalidatePath("/td-105-nonsense-path")` leaves
`map-unplace.spec` passing, count assertion included.

_(2026-09-11: this correction was itself half wrong, and both comments were
corrected again. The refresh **does** come from `unplacePlace`'s
`revalidatePath` call — through the flag, not the path. And `pnpm dev` does
not re-render the page after an action that sets no flag: the
`skipPageRendering` branch is the same in dev.)_

### TD-106 ✅ A standing lint warning: the error boundary's "Vai alla home" leaves the page with a full document load — **DONE (2026-09-05)**

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-05, by `pnpm lint` reporting one warning where TD-22's policy says the count is zero

`MapErrorBoundary.tsx` renders two recovery buttons. "Riprova" calls
`handleReset`, which clears `hasError` and remounts the map subtree in place.
"Vai alla home" assigned `window.location.href = "/"`, and
`@next/next/no-location-assign-relative-destination` reported it: _"Use
`redirect()` in the render phase, or `useRouter().push()` in Client
Components' event handlers instead."_

**The code did not change; the rule set did** — but not where it was first
attributed, and the correction is the reason this paragraph is here. The
warning was read as arriving with the `next` 16.3.3 bump (PR #239, `ac63000`,
2026-09-01). It did not: `eslint-config-next` is a separate devDependency, and
the lockfile at `ac63000^` already resolves it to 16.3.3. It reached 16.3.3 in
PR #237 (`5dc70ed`, 2026-08-31) and 16.3.0 in `57f0410` (2026-08-10) — and the
oldest plugin copy present in this checkout's store, 16.3.0, already ships the
rule and marks it `recommended`, which is what `core-web-vitals` switches on.
So the warning has stood since **2026-08-10 at the latest**, three weeks longer
than the `next` bump suggests, and possibly longer still: 16.2.12's plugin is
not in the store here, so "arrived at 16.3.0" is the earliest bound that could
be checked rather than a confirmed first appearance.

**Why one warning is worth an entry.** TD-22 took this repo from 293 warnings
to 0 and put every rule back to `error`, so that a regression fails the build
instead of accumulating quietly. A single standing warning is the start of
exactly the pile that policy exists to prevent, and it is not free in the
meantime: it makes `pnpm lint`'s output non-empty, which is where the next
warning hides.

**Resolved as a documented disable, not a behaviour change.** The rule's
suggestion is wrong for this specific call site, on four counts:

1. **The soft path already exists.** "Riprova" is the in-place retry. "Vai
   alla home" is the harder option, for when that did not help. Making it a
   `router.push()` gives the boundary two soft paths and no way out.
2. **Leaflet keeps state outside React** — a map instance, panes attached to a
   container, handlers bound to DOM nodes. A crash mid-lifecycle can leave
   that half torn down. A client-side navigation keeps the same JS heap and
   the same React root, i.e. exactly the state the crash happened in; a
   document load discards it. The property the rule is protecting is the one
   this button must not have.
3. **The recovery path must not depend on the machinery that just failed.**
   A document load is handled by the browser and does not care what state the
   app's router is in.
4. **`useRouter` is a hook, and this is a class component** — error-boundary
   lifecycle methods have no hook equivalent. It could only be threaded in
   from the `MapErrorBoundary` wrapper as a prop, which reintroduces (3).

**What shipped.** The inline arrow became a `handleGoHome` class property, so
that the disable comment has a legal home — a JSX attribute has nowhere to
hang an `eslint-disable-next-line`, and `{/* … */}` between attributes is not
valid JSX. The disable carries its reason inline per the project rule, with
the long form as a doc comment on the method. A regression test in
`MapErrorBoundary.test.tsx` stubs `window.location`, clicks the button and
asserts `href` became `/`; it was confirmed red against a neutered handler
before being kept.

**One thing to know before touching this again:** the rule only reports a
destination it can resolve statically to a relative string — read
`no-location-assign-relative-destination.js`, which returns early from
`getStaticStringPrefix` for anything non-constant. So making the href dynamic,
which is exactly what TD-107's locale fix does, silences the warning as a side
effect. That is evasion, not resolution. **Keep the disable comment and its
reason when the literal `/` becomes a prop** — the decision it records is still
what the code does, and without it the next reader has nothing to distinguish a
deliberate document load from an oversight.

> **Amended 2026-09-11 (TD-107):** the intent above held, the letter did not.
> Once the rule stops reporting, the directive is _unused_, and ESLint flags an
> unused disable directive as a warning — so keeping it would have re-created
> the standing warning this item removed. The reason now lives on as a plain
> comment on the same line, naming the rule; the doc comment and the
> regression test are unchanged.

### TD-107 ✅ "Vai alla home" in the map error boundary drops the reader's locale — **DONE (2026-09-11)**

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-05, while deciding TD-106 — noticed, deliberately not fixed in that change, which was scoped to the lint warning alone

`handleGoHome` navigates to the literal `/`. `i18n/routing.ts` sets
`localePrefix: "as-needed"` with `localeDetection: false`, and next-intl's
`resolveLocale` gates **both** the cookie (prio 2) and the `accept-language`
header (prio 3) on `localeDetection`, falling through to `defaultLocale`. So an
unprefixed `/` always resolves to `it`. A reader on `/en/dashboard/geography`
who hits the error boundary and clicks "Go Home" lands on the Italian
dashboard — and the `NEXT_LOCALE` cookie the LocaleSwitcher wrote does not save
them, because that gate is off. Verified against
`node_modules/next-intl/dist/esm/development/middleware/resolveLocale.js`, not
inferred from the routing comment.

**The fix keeps the document load.** `MapErrorBoundary`, the function-component
wrapper that already resolves the labels through `useTranslations`, can read
`useLocale()` and pass a `homeHref` down beside them; the class assigns that
instead of the literal. Do **not** reach for next-intl's `useRouter().push()`:
TD-106 settled that this button stays a full document load, and the hook cannot
be called from the class anyway.

**Low, and it should stay low.** This is a fallback UI reached only after a
Leaflet crash, and the reader can switch locale back from the dashboard. It is
filed so the locale loss is a known, chosen state rather than a surprise — not
because it is worth a session on its own. Fold it into the next piece of work
that touches this file.

**What shipped.** As planned above: the wrapper reads `useLocale()` and passes
`homeHref={getPathname({ href: "/", locale })}` from `@/i18n/navigation`, so
the prefix rule stays next-intl's rather than being restated here — `/` for
`it`, `/en` for `en` (checked in `applyPathnamePrefix`/`prefixPathname`, which
also strip the trailing slash). Still a document load. The regression test sets
the locale to `en` and asserts the assigned href; it was red against the
literal `/`. **Its `getPathname` is a fake** returning `en:/` — next-intl's
`createNavigation` cannot load under Vitest (a bare `next/navigation` import in
ESM), which is why every other test that touches `@/i18n/navigation` mocks it
too. So the test pins that the boundary asks for home in the reader's locale,
not the prefix rule itself. Not exercised in a browser: reaching the boundary
needs a Leaflet crash. The TD-106 disable directive went unused and was
replaced by a plain comment — see TD-106's amendment.

### TD-108 ✅ A landmark created in this session had no numeric id, and `PlacePopover` converted it as though it did — **DONE (2026-09-09)**

**Severity:** 🟡 Medium · **Effort:** S · **Found:** 2026-09-08, while building SPEC-017 T10 — an e2e caught the same mistake in new code, which is what sent me looking for older copies of it

`usePOIManager.addPOI` gives a new landmark a client id (`poi-1788881303808-3f2a9`) and records the real one in `serverIdsRef` when the create lands. **It never swaps the id on the row itself**, so a landmark created in this session keeps its `poi-…` id until the next `loadPOIs`. `PlacePopover` converts that id twice:

```ts
: { poiId: Number(target.poi.id) };      // the entities-at-this-place key
const attachPoiId = poi ? Number(poi.id) : null;   // AttachEntityButton's pre-fill
```

`Number("poi-1788…")` is `NaN`. Nothing guards the click that opens the popover (`handlePOIClick` checks only `isMeasuring`), so the window is reachable: create a landmark, click it without reloading, and the popover's entity list queries `poiId: NaN` while "Collega un'entità" pre-fills the same. SPEC-016 T4's attach then fails validation at the mutation.

**Reproduced in the app on 2026-09-09, against the real database, and the failure mode is louder than this card predicted.** The guess above — "an error toast, or a silently empty list" — was wrong in the worst direction. A landmark was created on the "Piani di Esistenza" map and clicked without reloading: the popover's "PRESENTI QUI" section listed **137 rows** — every one of the 119 NPCs and 5 deities in the campaign — as present at a landmark that had none. After a reload, the same landmark clicked in the same place correctly said "Nessun personaggio o divinità in questo luogo."

The mechanism is `Number("poi-1788…")` → `NaN` → `fetchEntitiesAtPlace({ poiId: NaN })` → Prisma serialises its arguments as JSON, and `JSON.stringify(NaN)` is `null`, so `where` becomes `{ poiId: null }` and matches every entity not attached to a landmark. (The effect was verified against the database; the generated SQL was not read.) That is worse than an error, because it does not look like one: it reads as a true statement about the world.

**Two corrections to the description above.** "Nothing guards the click" was false — `usePOIManager`'s marker click always checked `serverIdsRef.current.has(poi.id)`. It guarded the wrong half: it refused the _harmless_ click, while the create was still in flight and there was genuinely no row, and permitted the _broken_ one, because once the create resolves the id exists in `serverIdsRef` while `POI.id` is still the client key. So the window opens **when the create succeeds**, not before it does. And the attach half (`AttachEntityButton`'s pre-fill) was not demonstrated: the entity picker could not be driven through browser automation. A "Too many re-renders" crash into the map error boundary was seen once in the `NaN` window and could not be reproduced in the healthy one for comparison, so it is **not** attributed to this item — it wants its own look.

**Fixed by the first shape, not the second — and the second is rejected, not merely unchosen.** `usePOIManager` resolves the row id at the click that needs it and passes it as `onPOIClick`'s second argument; `WorldMap` puts it on `PopoverTarget`'s `poi` variant as `poiId: number`; `PlacePopover` reads that field and converts nothing. The guard now produces the value it used to merely assert, so the two halves cannot drift apart again, and a landmark whose id is unknown cannot reach the popover at all — the invalid state is unrepresentable at that boundary rather than defended against by each consumer.

The second shape — reconciling the id onto the row inside `addPOI` — was described here as "the better one, because it removes the whole class of bug". **That reading was wrong, and it contradicts a decision the code already records.** `usePOIManager`'s doc comment, note 1, says reassigning `POI.id` mid-flight _is_ the bug SPEC-002 §9 predicted: `markersRef` is keyed by that id, so a marker created under the temporary key is orphaned the moment the key changes — visible on the map, absent from the map used to remove it — and it concludes that "a stable key removes the problem rather than managing it". SPEC-002 §9 agrees in its own words: "swapping it mid-flight is where a bug would hide". So reconciliation is not half-built groundwork waiting to be finished; the swap is absent **on purpose**. Doing it anyway would mean re-keying `markersRef`, `operationsRef` and `serverIdsRef` together and atomically — a larger change than this item's S, reversing a recorded decision, and one that would need an ADR rather than a debt fix. Do not re-propose it without that.

**Shipped:** `usePOIManager.ts`, `WorldMap.tsx`, `PlacePopover.tsx`, with three regression tests — the hook hands over the row id once the create resolves (`usePOIManager.test.ts`), `WorldMap` puts it on the target instead of converting the key, and the popover addresses the row for a landmark created in this session (`PlacePopover.test.tsx`). All three needed the client key and the row id to be **different** values to be able to fail: the existing fixtures used `poi.id === "42"` with row 42, where `Number(poi.id)` returns the right answer by accident, which is why nothing caught this before.

**Related:** SPEC-017 T10 (where this was found and worked around for one caller), SPEC-016 T4 (the attach flow that would break), TD-102 (the other half of "an id alone does not say which row").

### TD-109 ✅ No e2e covers the landmark popover's entity list, so TD-108's fix is guarded by unit tests only — **DONE (2026-09-10)**

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-09, closing TD-108

TD-108's bug was invisible at every boundary taken alone and appeared only where they met: the client key became `NaN` in `PlacePopover`, crossed a Server Action, and Prisma's JSON serialisation turned it into `null`, so `fetchEntitiesAtPlace`'s where collapsed to `{ poiId: null }`. The three regression tests TD-108 shipped each cover one boundary with the next one mocked — the hook, `WorldMap`, the popover. None crosses the Server Action and Prisma, which is exactly where `NaN` became a query that matched everything. A later change that reintroduces the conversion by another route — a new consumer of `poi.id`, say — would pass all three.

`e2e/map-landmark-popover.spec.ts` has two cases (edit then delete; send back to the unpositioned places) and neither reads the entity list.

**The spec, and the one condition that lets it fail.** Create a landmark through "Aggiungi luogo" with Kind `poi` (`e2e/helpers/mapContextMenu.ts` already drives the right-click), click its marker **without reloading**, and assert the popover renders `popover.entitiesEmpty` rather than a list. On its own that is vacuous: on the broken code the query is `WHERE "poiId" IS NULL`, and if the e2e database holds no NPC or deity without a landmark, that returns nothing too — the empty state renders and the test passes on the bug. So the spec must guarantee at least one entity with a null `poiId` exists before the click, and should create that row itself rather than trust the seed or another spec's debris. No helper creates an NPC today and there is no `npc-crud.spec.ts` to borrow from; `/dashboard/admin/npc/new` is the UI route. Delete both rows at the end, as the other CRUD specs do.

Watch it fail before trusting it: reintroduce `Number(poi.id)` in `PlacePopover` locally and confirm it goes red. TD-101's spec was green on a vacuous assertion for want of exactly this check.

**Shipped (2026-09-10):** a third case in `e2e/map-landmark-popover.spec.ts`. It creates an NPC through `/dashboard/admin/npc/new` — the landmark-less row the broken query would match — then a landmark, clicks it without reloading, and asserts the popover's empty state before asserting the NPC's name is absent (the empty state replaces the loading line only once the list has loaded, so the absence check cannot pass on a fetch still in flight). Both rows are deleted at the end. **Seen red first:** with `Number(target.poi.id)` restored in `PlacePopover`, the empty state never rendered, and the failure snapshot listed the new NPC — with its "Rimuovi … da questo luogo" button — among the entities present at a landmark created seconds earlier. **One correction to the card above:** `e2e/npc-crud.spec.ts` does exist; its create flow is the one the new case follows.

**Related:** TD-108, TD-101 (an e2e that could not fail), SPEC-016 T1 (`fetchEntitiesAtPlace`).

### TD-110 ✅ "Too many re-renders" took the map down while picking an NPC to attach to a landmark — seen once, not reproduced, not attributed — **DONE (2026-09-10)**

**Severity:** 🟡 Medium (provisional — see below) · **Effort:** S · **Found:** 2026-09-09, during TD-108's in-app reproduction

**What happened.** On the DM's "Piani di Esistenza" map, a landmark created moments earlier — so still carrying its `poi-…` client key, the TD-108 window, before that fix — was clicked; "Collega personaggio" opened `AttachEntityButton`; Tipo was set to NPC; and the NPC `<select>` was set to Adalbert (id 561). The whole map collapsed into `MapErrorBoundary` with "Too many re-renders. React limits the number of renders to prevent an infinite loop.", component stack pointing at a minified `_t`. No write happened: Adalbert's row was unchanged afterwards.

**Why it is not attributed to anything.**

- The selects were driven by browser automation (`form_input`), not by a hand on the native control, so the automation is itself a candidate cause.
- The comparison that would have settled it never ran. After a reload (numeric id, the healthy window) the same automation could not make the NPC `<select>` hold a value at all: it read back empty every time, and neither a native-setter `change` event nor keyboard focus got through. That the select would not keep a programmatically set value is itself unexplained — the automation, or a sign the picker's controlled value is not being stored.
- So three candidates stand, none ruled out: the `NaN` `poiId` pre-fill TD-108 has since removed; a genuine render loop in `AttachEntityButton`'s picker, independent of the id; or an artefact of how the value was set.

**First step — by hand, not by automation.** On current `main` (TD-108 fixed), create a landmark and, without reloading, attach an NPC to it by picking from the native select. Then do the same on a landmark after a reload. If neither crashes, the `NaN` pre-fill was the trigger and this closes with TD-108 as its fix. If either does, it is the picker's own loop — read `app/ui/geography/AttachEntityButton.tsx`'s effects and `onChange` handlers for a state update that re-triggers itself.

The severity is a placeholder. If it reproduces it takes the whole map down, not just the dialog, and is High; if it does not, the item closes.

**Attributed and closed (2026-09-10): TD-108's `NaN` pre-fill was the trigger, and TD-108 is the fix.** Settled deterministically rather than by hand, which also rules the automation out: a throwaway Vitest case rendered the real `Select` (`app/ui/forms/inputs/Select`, no mocks) with `value={NaN}`, and it threw exactly "Too many re-renders" on mount — closed, never opened. With `9` or `0` it rendered cleanly. `Select` holds no state of its own, so the render-phase loop is inside Headless UI 2.2's `Listbox`, the minified `_t` in the stack. The path: `attachPoiId = Number(poi.id)` was `NaN` → `AttachEntityButton`'s `poiId` → `AssignLocationModal`'s `useState(currentPoiId)` → `value={poiId ?? NO_LANDMARK}`, where `??` lets `NaN` through because it is not nullish. The modal mounts the moment an NPC is picked, which is why the crash came exactly then.

- **The second candidate is ruled out.** Neither `AttachEntityButton` nor `AssignLocationModal` calls a setter during render, and the same `Select` with a real id does not loop.
- **The read-back-empty after the reload is by design, not a lost value.** The NPC `<select>` is hardcoded `value=""`: picking an option closes the picker (`isOpen && selected === null`) and mounts `AssignLocationModal`, so the select reads back empty whatever is chosen. Whether the automation's `change` reached React after the reload was not established, and no longer needs to be.
- **The regression test already exists.** TD-108's `PlacePopover.test.tsx` case "addresses the row, not the client key, for a landmark created in this session" asserts that the attach control receives the row id, not the key.
- **No guard was added, deliberately.** A `NaN` check in the generic `Select` or in the modal would defend a value TD-108 made unreachable, and would turn a loud crash into a silently wrong pre-fill — the failure mode TD-108's write-up calls worse than an error. That the crash took the whole map down rather than just the dialog is a question about where `MapErrorBoundary` sits, not about this item.

The by-hand check above was not run; the unit reproduction supersedes it.

**Related:** TD-108, SPEC-016 T4 (the attach flow), TD-107 (the same error boundary).

### TD-111 ✅ A POI load that lands late overwrote places just added, moved or deleted on the map — **DONE (2026-09-11)**

**Severity:** 🟡 Medium · **Effort:** M · **Found:** 2026-09-11, `map-place-repositioning.spec.ts` failing all three CI attempts on PR #267 (run 34620868268), a change that could not have touched it; `main` was green on identical code a minute earlier

**The cause, read out of the CI trace rather than guessed.** Playwright keeps a
trace for the first retry; its network log carries every Server Action's
request and response body:

1. The map fires `fetchPlaceChildren(1)` four times in its first ~1.5s.
   `usePOIManager.loadPOIs` answered each one by replacing the whole list and
   the whole `serverIdsRef` map.
2. The test saved a POI at 25.743. The row appeared optimistically and
   `createPoi` was queued — and Next sends one client's Server Actions **one
   at a time**, so the last startup load, issued earlier, went first (25.806).
3. That load read the database before the create existed and replaced the
   list: the new row vanished.
4. `createPoi` then succeeded (`{"ok":true,"id":6}`, 25.940). Nothing put the
   row back, so the test waited 30s for a row that would never render.

On a fast machine the startup loads settle before the first click; on the CI
runner they overlapped it — the same "init tail on slow environments" family
as TD-100. **For the DM this is real, not a test artefact:** a place added,
moved or deleted right after the map opens could vanish, snap back or come
back until the next reload, although the write itself was saved. Attempts 1
and 3 failed on the drag instead (the row's coordinates never changed); no
trace exists for them, so that they are the same overwrite of an optimistic
_move_ is very likely but not proven.

**Two wrong turns on the way, kept so they are not retaken.** First reading:
the retries failed because the test cleans up only on success, leaving
attempt 1's marker where the retry creates its own. A local probe (fail
attempt 0 after the save, `--retries=1`) disproved it — the retry passed — and
the trace shows the retry had clicked at different coordinates anyway. Second:
that no request left the browser after Save — a misaligned clock; `createPoi`
was sent. The cleanup-only-on-success pattern is still true of every spec in
`e2e/` (none uses `finally` or `afterEach`) and still leaks rows into the e2e
database when a test fails; it just did not cause this.

**The fix.** Every local write stamps the POIs it touches (`touch`, a
sequence counter in `writeSeqRef`/`lastWriteRef`). A load remembers the
sequence it started at; when it lands, it takes the server's version of every
POI nothing touched since, and the local one of everything touched — edited
rows keep their edit, deleted rows stay gone, rows created in this session
are kept even though the snapshot predates them. A snapshot that already saw a
session-created row lists it under its database id; that row is skipped by
id, so it does not show twice. `serverIdsRef` is merged, not replaced — a
replacement also dropped the database id of a POI created during the load,
which a later delete or move of it needs. `POI.id` is never re-keyed (the
2026-09-09 decision in `CLAUDE.md`). A load with no write since it began
behaves exactly as before.

**Tests.** A `usePOIManager.test.ts` block holds a load open, writes, then
lands the load: add, move and delete were red before the fix with exactly the
CI symptoms; two guards (no duplicate row, an untouched load still replaces)
were green before and after. `map-place-repositioning` and `map-poi-crud` pass
locally — which proves no regression, not the fix: the race needs the CI
runner's timing.

**Not investigated:** why the map loads its POIs four times at startup.
Fewer loads would narrow the window without closing it, so it is not a
substitute for the fix above; worth a look if startup cost ever matters.

**Related:** TD-100 (the same slow-environment init tail), TD-101 (this
spec's earlier false green), TD-105 (the same trace shows `createPoi`'s
response carrying `x-action-revalidated: 1` — the flag that entry is about).

### TD-112 — `tailwind.config.ts` is never loaded, so its shimmer, blues and forms plugin are missing from the built CSS

**Severity:** 🟡 Medium · **Effort:** S · **Found:** 2026-09-17, while drafting the design-system roadmap entry

Tailwind v4 reads a JavaScript config only through an `@config` directive, and
`app/ui/global.css` has none (it is `@import "tailwindcss"` and nothing else of
Tailwind's). So everything `tailwind.config.ts` declares is silently absent.
Checked against the dev build's CSS on 2026-09-17:

- **`shimmer` keyframes** — absent. `skeletons.tsx` animates with
  `animate-[shimmer_2s_infinite]`, so the loading skeletons very likely do not
  shimmer at all. Not yet confirmed by watching one.
- **`blue-400/500/600` overrides** — absent; `--color-blue-500` is v4's default
  (`#3080ff`), not the config's `#0070F3`.
- **`@tailwindcss/forms`** — not applied, so form controls get Preflight's
  reset only.
- **`gridTemplateColumns["13"]`** — v4 generates `grid-cols-13` natively anyway.

**The fix, in shape:** move the three settings that matter into `global.css`
(`@theme` for the keyframes and, if they are still wanted, the colours;
`@plugin "@tailwindcss/forms"`) and delete the JS file, or add
`@config "../../tailwind.config.ts"`. The first matches v4's CSS-first model,
and it is where a design system's tokens would live (see `docs/ROADMAP.md`,
Phase 5, "A design system"). **Check before merging:** turning the forms plugin
on restyles every input, so look at a form and the map panels afterwards. The
`content` glob that CLAUDE.md rule 8 describes is v3 behaviour too; v4 detects
sources automatically, so that rule's wording should be updated with the fix.

### TD-113 — Admin list pages show nothing on a phone: the table is `hidden md:table` with no fallback

**Severity:** 🟠 High · **Effort:** M · **Found:** 2026-09-17, design critique at 375px

`app/ui/components/EntityList.tsx:113` renders the admin table as
`hidden min-w-full md:table`. The Next.js tutorial this app grew from paired
that with an `md:hidden` card list; that half is gone. Below 768px, every admin
list (spells, magic items, NPCs, deities, factions, treasures) shows an empty
grey strip and the pagination, so there is no way to edit or delete from a
phone. Seen on `/admin/spells`: the table measured 0px wide.

**The fix, in shape:** a stacked row per item below `md` (name, the page's
first two columns, edit and delete), built from the same `PageMeta` columns
the table uses rather than a hand-written card. Add an e2e test at a phone
viewport that checks a known row is visible.

### TD-114 — Pages are wider than a phone screen: a fixed 900px form, a header row that doesn't wrap, and an icon nav that doesn't fit

**Severity:** 🟠 High · **Effort:** M · **Found:** 2026-09-17, design critique at 375px

At a 375px viewport the browser's layout width grew to 924px on
`/admin/spells/new` and 784px on `/admin/spells`, so the page is zoomed out or
cut off at the right edge. Three causes:

- `app/ui/forms/EntityForm.tsx:146` — `w-[900px]` on the form wrapper. It
  should be `w-full max-w-[900px]`.
- The list header (search, "N di N trovati", "Nuovo …", "Reset Filtri") is one
  non-wrapping row. At 375px the search box shrinks to its icon and "Nuovo
  Incantesimo" is cut off; at 800px the search box already shows only "Cerca".
- The top nav on small screens (`app/ui/dashboard/nav-links.tsx`) is one row of
  ten icon tiles, several of them doubled with a pencil icon, which runs past
  the right edge. Icons alone also do not say which tile is which domain.

**The fix, in shape:** fix the width on the form, let the header row wrap
(search on its own line below `sm`), and make the small-screen nav either
scroll with a visible affordance or collapse into a menu. Add a phone-viewport
e2e test that checks `document.documentElement.scrollWidth <= innerWidth` on
one list, one form and the overview.

### TD-115 — Dark mode is half there: map components follow the OS setting, the rest of the app does not

**Severity:** 🟡 Medium · **Effort:** S (to remove) / L (to finish) · **Found:** 2026-09-17, design critique

24 files have `dark:` classes: `app/ui/geography/*` and the vendored
`app/modules/maps/components/**`. Tailwind v4's `dark:` variant follows
`prefers-color-scheme`, so on a computer set to dark mode those map panels,
menus and popovers turn dark while the page around them, and every other page,
stay light. No page sets `color-scheme` or a dark background.

(The in-app browser pane showed a black page background in dark mode, which
made forms unreadable. That is probably the pane itself, since the page's
`color-scheme` is `normal`, so it is not recorded as a finding. Check once in
real Chrome with the OS in dark mode.)

**The fix, in shape:** this is a decision, not a tweak. Either remove the
`dark:` classes from `app/ui/geography/*` now and leave the vendored module
alone (it is not wired to a theme; the 2026-07-22 "unused is not dead" rule
applies to it), or make dark mode a goal in the design-system spec. The first is
a small change and is the honest state until the spec exists.

### TD-116 — Two page-title styles: `PageTitle` is Lusitana, `EntityForm`'s heading is bold Inter

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-17, design critique

List, detail, search and map pages use `app/ui/typography/PageTitle.tsx`
(Lusitana, `text-2xl`). The create and edit forms use their own
`<h1 className="text-2xl font-bold mb-6">` in `app/ui/forms/EntityForm.tsx:147`,
in Inter. The heading changes typeface when you move from a list to its form.
Section headings (`Avventure`, `Scene`, `Budget dell'avventura`) are a third,
unshared style. **Fix:** `EntityForm` uses `PageTitle`; add a `SectionTitle`
beside it and use it for in-page `h2`s.

### TD-117 — Two button components with different primary colours, plus hand-rolled buttons

**Severity:** 🟢 Low · **Effort:** M · **Found:** 2026-09-17, design critique

- `app/ui/buttons/BaseButton` — violet primary (`violet-600`, chosen for
  contrast in TD-15), white secondary, rose danger. Used in about 40 files.
- `app/ui/button.tsx` — the Next.js tutorial's `Button`, blue (`blue-500`, a
  TD-112 casualty: its intended shade never loads). Still imported by
  `login-form.tsx`, `EntityForm.tsx` and `sidenav.tsx`, so the login page's
  primary action is blue and the rest of the app's is violet.
- Eleven files write `<button>` directly (mostly `app/ui/geography/*`, plus
  `NpcCard.tsx` and `AssignLocationButton.tsx`), each with its own classes.

Not dead code, since it is imported, so this means merging, not deleting.
**Fix:** move the three `button.tsx` callers onto `BaseButton` (adding a
variant if one is missing), then delete `button.tsx`; move the hand-rolled
buttons over where `BaseButton`'s variants fit, and leave the map-control icon
buttons alone if they don't.

### TD-118 — The same domain looks unrelated between its public and admin lists, and admin rows are dominated by buttons

**Severity:** 🟢 Low · **Effort:** M · **Found:** 2026-09-17, design critique

- `/spells` is a stack of dark navy accordion rows under two rows of violet
  filter chips; `/admin/spells` is a white table with column filters. The same
  361 spells look like two different apps.
- On `/npc`, the name column is narrow enough that "Aldric Valmonte" and its
  subtitle wrap over four lines, while the place name on the right is set
  larger than the NPC's own name, so the eye goes to the place first.
- Every admin row carries a solid violet "Modifica" and a solid rose "Elimina":
  on a full page that is 20+ saturated buttons, and they outweigh the data.
  Delete already asks for confirmation (`DeleteButton` → `ModalButton`), so a
  quieter icon or ghost style costs no safety.

**Fix, in shape:** row actions become icon buttons with `aria-label`s (secondary
or ghost variant, danger colour on hover only); public rows get a wider name
column and a smaller place label. Unifying the public and admin _layouts_ is a
design-system spec question, not this item.

### TD-119 ✅ `/world` is a dead end once the world exists — **DONE (2026-09-17)**

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-17, design critique

`app/[locale]/dashboard/[system]/world/page.tsx` shows «Il tuo mondo, «…»,
esiste già.» and nothing else: no link to the map (`/geography`), where the
world actually is. **Fix:** link to `/geography` from that message, or redirect
there, since the page has nothing else to do once the world exists.

**Resolution:** Added a "Vai alla mappa" / "Go to the map"
(`world.page.viewMapLink`, both catalogues) link next to the "already exists"
message, using the same `Link` + `dashboardPath` + `isGameSystem`/`notFound`
pattern `geography/page.tsx` already uses for its reverse link. Nothing left
undone.

### TD-120 ✅ Form layout: tiny all-caps labels, short description boxes, and "Reset Filtri" in the Italian UI — **DONE (2026-09-17)**

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-17, design critique

- Form labels are small, bold and all caps (`NOME`, `TEMPO DI LANCIO`). All caps
  slows reading and adds little here, where the field is right below.
- On the spell form, `Descrizione` and `Ai livelli superiori` are the long
  content, but their textareas are about four lines tall, while the short
  selects get the prominent top row. They should be taller (or grow with their
  content).
- The Italian catalogue's `reset` is "Reset Filtri" (`messages/it.json:86`),
  half English. Suggest "Azzera filtri".

**Resolution:** `FormLabel.tsx` dropped `font-bold uppercase` for
`text-sm font-medium text-gray-900` (normal case, readable). Added a `tall?:
boolean` flag to `PageMeta`/`FormField`, read by `InputComponent` and
`TextareaInput` — a taller box (`h-[280px]` vs `h-[150px]`) declared through
the metadata layer, not hardcoded per domain. Set on the shared `description`
field (`pageMetaFields.ts`, so every domain's description grows, not just
spells') and on `spells.upcast` ("Ai livelli superiori"). `common.filters.reset`
is now "Azzera filtri". Left undone: reordering fields so the long textareas
aren't below the short selects — the TD's fix-in-shape only asked for height,
and reordering touches per-domain form layout (`app/ui/<domain>/`), a
separate, larger change.

### TD-121 — The world map opens with the image at about half the canvas

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-17, design critique; seen once

On `/geography` ("Piani di Esistenza") at a 1280px viewport, the map image took
about half the canvas width, with a wide grey margin on every side. Seen once
and not investigated: the initial `fitBounds` padding may be deliberate, so read
`WorldMap.tsx`'s initial view before changing it. If it isn't, fit the image to
the canvas on first load.

### TD-122 ✅ Create and update actions validate their input, then write the unvalidated copy — **DONE (2026-09-17)**

**Severity:** 🟠 High · **Effort:** M · **Found:** 2026-09-17, tech-debt audit

Every entity and campaign action runs `safeParse(formData)` and then writes
from `formData`, not from `parsed.data`. Confirmed in
`app/lib/data/treasure/createTreasure.ts:24-33` and
`app/lib/data/deities/updateDeity.ts:24-33`; the same shape is in
`updateSpell`, `updateMagicItem`, `updateFaction`, `updateNpc`,
`campaigns/updateCampaign`, `campaigns/updateAdventure` and the create actions
(`createScene.ts:28-41`, `createCampaign.ts:28-37`, …). Consequences:

- **Undeclared keys are written.** `buildEntitySchema.ts:21-22` says unknown
  keys "are stripped, not rejected", but that holds only for `parsed.data`.
  The update actions copy every key of `formData`, so
  `updateDeity({ id, zoneId, poiId })` would set a location while skipping
  `assignLocation`'s rules (the exclusive pair, TD-93's guard).
- **Coercions are thrown away.** `treasureMeta.ts:34-47` turns `""` into
  `null` and `"20"` into `20`, but `createTreasure` writes the raw string to
  `value Int?` (`schema.prisma:332`). The text input stores a string
  (`TextInput.tsx:35`, `InputComponent.tsx:66-72`), so saving a treasure with
  a value should be rejected by Prisma. Read from the code, not reproduced:
  the unit tests pass numbers and `e2e/treasures-crud.spec.ts` never fills the
  field. Reproduce it first, as the regression test.
- `where: { id: formData.id }` uses the id before Zod has coerced it.
- `createSpell`, `updateSpell` and `deleteSpellById` have no unit tests (TD-80
  covered the other domains).

CLAUDE.md rule 2 says validate before writing, and this satisfies it in
letter only. **The fix, in shape:** every action writes from `parsed.data`,
restricted to the declared keys. Add regression tests for `value: "20"` and
for an extra `zoneId` key, and add the missing spell action tests.
**Related:** TD-02, TD-80, TD-93.

**Resolution:** all six entity actions (`create*`/`update*` for spells,
magic items, NPCs, deities, factions, treasure) and all ten campaign
create/update actions now read from `parsed.data`. Zod strips undeclared keys
and leaves absent optional keys absent, so an update writes exactly the
declared fields the payload carried, coerced, and `where` uses the coerced
`id`. Because the schemas are built from a runtime field list, their output
type is widened; each action narrows it with one commented assertion
(`as Partial<T> & { id: number }` / `as Omit<T, "id">`) rather than a new
typed builder. Regression tests: `createTreasure` with `value: "20"` and
`""`, `updateDeity` with extra `zoneId`/`poiId`, a string id, and a partial
payload; new `createSpell`, `updateSpell`, `deleteSpellById` tests.

### TD-123 — `MapPOIPanel` still has 18 hardcoded English strings, including the confirm before deleting every landmark

**Severity:** 🟠 High · **Effort:** S · **Found:** 2026-09-17, tech-debt audit and accessibility review (both found it)

`app/modules/maps/components/map/MapPOIPanel.tsx` is live (`WorldMap.tsx`
renders it), but under `/it` it shows English: toasts (lines 437, 452, 465,
474, 481, 494, 518), `title=` attributes (165, 189, 199), placeholders (659,
668, 766, 784), "Add"/"Import"/"Export" (805, 814, 824), "No places yet",
"Edit Place"/"Add Place", and a `"Close"` `aria-label` (1004). Screen
readers read these with an Italian voice (WCAG 3.1.2). TD-95 is marked done for
this file but moved only five strings; the "Svuota" button on the same row
already uses `t()`.

The worst case is line 572: a native
``confirm(`Are you sure you want to delete all ${pois.length} POIs?`)``
guards `clearAllPOIs` (`usePOIManager.ts:641-669`), which permanently deletes
every landmark on the map on the server. **The fix, in shape:** move all of
these strings into both catalogues, and replace the native `confirm` with the app's
confirm dialog (as `DeletePlaceButton` does). **Related:** TD-95, TD-21.

### TD-124 — Server-written error messages reach the Italian UI in English

**Severity:** 🟡 Medium · **Effort:** M · **Found:** 2026-09-17, tech-debt audit

About 14 action sites return literal English messages:
`checkPlacement.ts:73` (`Overlaps an existing area: ${title}.`),
`createNpc.ts:60`, `updateNpc.ts:42`, `placeZone.ts:108,114`,
`createRootPlace.ts:45`, `resolveLocationAssignment.ts:37,57`, and the
`reorder*.ts` actions. `WorldMap.tsx:511-528` passes the first message to the
panel as-is, and `FormErrorSummary.tsx:38` joins them as-is; Zod's own default
messages take the same path. **The fix, in shape:** actions return message
keys plus parameters, and the render boundary translates them, per
[ADR-0007](./adr/0007-message-key-resolution-boundary.md).
**Related:** TD-21, TD-62.

### TD-125 — The four reorder actions accept duplicate ids, and a failed reorder says "Delete failed"

**Severity:** 🟡 Medium · **Effort:** S · **Found:** 2026-09-17, tech-debt audit

`reorderScenes.ts:46-50`, `reorderLoot.ts:44-48`,
`reorderSceneCreatures.ts:44-48` and `reorderAdventures.ts:50-54` check only
`length === size && every(has)`. With existing rows `{1,2,3}`, the list
`[1,1,2]` passes: row 3 is never updated and ends up sharing a position.
Nothing in `schema.prisma` makes `(parent, position)` unique, and no test sends
duplicates. On failure, `SceneList.tsx:86`, `LootList.tsx:78` and the other
two lists show `common.deleteButton.deleteFailed`, with no try/catch around
the call. The four actions are near-copies of each other, as are the four
`move*` handlers. **The fix, in shape:** one shared validate-and-reorder helper
that also rejects duplicate ids, a reorder-specific error message, and possibly
a unique index on position.

### TD-126 ✅ Campaign forms stay on "saving" if a save throws, and most actions don't wrap database errors — **DONE (2026-09-17)**

**Severity:** 🟡 Medium · **Effort:** S · **Found:** 2026-09-17, tech-debt audit

`SceneForm.tsx:97-106` runs `await createScene(...)`, then
`setIsSaving(false)`, with no try/finally; the same holds in `LootForm`,
`SceneCreatureForm`, `CampaignForm`, `AdventureForm` and `AdventureInfoForm`.
The geography forms (`ZoneEditPanel`, `MapGridConfigPanel`) handle this
correctly. Most create and update actions (campaigns, spells, deities, magic
items, treasure, factions) don't wrap the Prisma call with
`toDatabaseError`, unlike `createNpc.ts:37-63` and the map actions, so a
database or session error throws unwrapped, the client doesn't catch it, and
the user sees nothing. **The fix, in shape:** one shared submit hook with
try/finally and an error toast for the six forms, and `toDatabaseError` in the
actions. **Related:** TD-10, TD-13.

**Resolution:** new `app/lib/hooks/useMutationSubmit.ts` owns the saving
flag, the returned field errors and a `submit` with try/finally; a thrown
action logs to the console and shows `common.form.saveFailed` (added to both
catalogues). The six campaign forms use it and refresh only when it resolves
`true`. The 20 create/update actions that lacked it (campaigns, spells,
deities, magic items, factions, treasure) now wrap their Prisma write with
`toDatabaseError`. Tests: the hook, a thrown-save regression in `SceneForm`,
and a `DatabaseError` case in six action tests. The geography panels keep
their own handling, deliberately.

### TD-127 — `WorldMap.tsx` is 1,329 lines and handles eight concerns

**Severity:** 🟡 Medium · **Effort:** L · **Found:** 2026-09-17, tech-debt audit

`app/ui/geography/WorldMap.tsx` has 57 hook calls, about 30 `handle*`
callbacks (lines 259-920) and 9 open/mode flags (164-197). It covers the
popover, measuring, upload, the grid, area drawing, positioning places, POI
import/export and loading the map image. It was 114 lines when TD-46
described it. `app/modules/maps/hooks/usePOIManager.ts` is 837 lines.
**The fix, in shape:** extract focused hooks (`usePlacePopover`,
`useAreaDrawing`, `usePlacePositioning`, `usePOIFileIO`), following
`app/modules/maps/`'s structure. Do it before the next map feature, not
alongside one. **Related:** TD-46, TD-131.

### TD-128 — `WorldMap`'s GeoJSON import skips the schema that `MapMain`'s import uses

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-17, tech-debt audit

`WorldMap.tsx:921-924` imports the result of `JSON.parse(text) as POIGeoJSON`
directly; `MapMain.tsx:193` runs `poiGeoJSONSchema.safeParse` first. A
malformed file fails deep in `usePOIManager.importGeoJSON` (712-778), or
produces one server rejection per feature instead of one clear error. The two
files also duplicate the export/import handlers. **The fix, in shape:**
validate with `poiGeoJSONSchema`, and share one import/export helper.
**Related:** TD-14, TD-02b.

### TD-129 — Map place and POI schemas restate field rules instead of using `zoneMeta`

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-17, tech-debt audit

`placeSchema.ts:18-19`, `poiSchema.ts:15-16` and `rootPlaceSchema.ts:12`
declare their own `title`/`description` rules; `zoneMeta.ts:28-32` itself
calls `placeSchema` "rule-2-non-compliant". The two already disagree: creating
a place accepts `description: ""` (`createPlace.ts:78-79`), while editing
rejects it (`zoneMeta.ts:62`, `.min(1)`), so "no description" can be stored two
ways. **The fix, in shape:** build these schemas from `zoneMeta`'s validators,
as `updateZoneDetails` already does. **Related:** TD-02, TD-104.

### TD-130 — Validator helpers copied into five files

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-17, tech-debt audit

`nullableToOptional` is defined in `sceneMeta.ts:35`,
`sceneCreatureMeta.ts:23`, `campaignMeta.ts:27`, `adventureMeta.ts:43` and
`zoneMeta.ts:15` (whose comment says it is "the fifth local copy").
`nullableAmountValidator` is in four meta files, and `treasureMeta.ts:44-47`
writes the same logic inline. **The fix, in shape:** move both into one shared
validators module under `app/lib/utils/`.

### TD-131 — Unused vendored map utilities still include Earth-geometry maths (ask before deleting)

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-17, tech-debt audit

`app/modules/maps/lib/utils/coordinates.ts:140-159` still has a haversine
`calculateDistance` (Earth radius 6371e3) and ±90/±180 clamping helpers. About
40 exports across `coordinates.ts`, `maps.ts` and `validation.ts` have no
caller outside their own tests; only `formatDecimalDegrees` and
`isValidBounds` are used, and `isValidCoordinate` is defined twice.
`poiSchema.ts:18-25` explains why geographic bounds are wrong for these pixel
maps, so a later session reusing one of these helpers would add a bug. These came in
with the vendored library, so CLAUDE.md's "unused is not dead" applies.
**Decision needed from the DM:** delete them, or mark them as vendored and not
for use on pixel maps. **Related:** TD-94.

### TD-132 — Leftover inline styles and Italian comments

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-17, tech-debt audit

- `app/modules/maps/hooks/useGeolocation.ts:111` builds marker HTML with
  `style="width: 16px; …"`, the pattern TD-72 removed elsewhere (the hook is
  used only by the vendored `MapControls`/`MapSearchBar`).
- `app/ui/components/Spinner.tsx:9,25` uses `style={{…}}` and has Italian
  comments at lines 10 and 20.
- `app/ui/geography/PlacePopover.tsx:254` sets `style={{ left, top }}`. That is
  a real runtime position, but rule 8 has no written exception for it.

**The fix, in shape:** switch the first two to Tailwind classes, translate the
comments, and add the runtime-position exception to CLAUDE.md rule 8.
**Related:** TD-72.

### TD-133 — The map has no keyboard path to create a place or open an existing one

**Severity:** 🟠 High · **Effort:** L · **Found:** 2026-09-17, accessibility review (WCAG 2.1.1)

On `/geography`, "Aggiungi luogo" opens only on right-click:
`useMapContextMenu.ts:158` listens only to Leaflet's `contextmenu` mouse event.
The POI panel's "Add" button doesn't help: until a location is set, its form
offers only "Click to select location on map" (`MapPOIPanel.tsx:673-696`),
with no fields for typing coordinates. Existing markers are `L.divIcon` `<div>`s
with no `tabIndex` (`useNavigableChildren.ts:249-252`), so Tab never reaches
them. A keyboard-only user can neither add a place nor open one.
**The fix, in shape:** add a Tab-reachable "new place here" entry point (at the
map centre, or via Shift+F10 / the context-menu key); let coordinates be typed
before any click; give markers `tabIndex=0` and an Enter/Space handler that
opens the same popover a click does. Because this touches SPEC-level
interaction, it may need a short spec. **Related:** TD-15, TD-123.

### TD-134 ✅ Filter chips don't expose their pressed state — **DONE (2026-09-17)**

**Severity:** 🟡 Medium · **Effort:** S · **Found:** 2026-09-17, accessibility review (WCAG 4.1.2)

On `/spells`, an active class or level chip only gains `bg-violet-700`;
`aria-pressed` stays unset. `BaseButton/getCSSClasses.ts:26-32` defines the
`selected` look, but `BaseButton/index.tsx` never maps `buttonState` to
`aria-pressed`. **The fix, in shape:** set
`aria-pressed={buttonState === ButtonState.Active}` on toggle-style buttons,
with a unit test.

**Resolution:** Added an `isToggle` prop to `BaseButton` — when set,
`aria-pressed` reflects `buttonState === ButtonState.Active` (true/false, on
every render branch: link, onClick button, submit button); when unset (the
default), no `aria-pressed` is rendered at all, so plain action buttons
(save, delete, ...) are unaffected even when their own `buttonState` happens
to be `Default`. `SelectButtonery`'s two chip usages (the "all" button and
each option) now pass `isToggle`. Unit tests in
`app/ui/buttons/BaseButton/index.test.tsx` (new) and an addition to
`SelectButtonery.test.tsx`.

### TD-135 ✅ Result counts change without being announced — **DONE (2026-09-17)**

**Severity:** 🟡 Medium · **Effort:** S · **Found:** 2026-09-17, accessibility review (WCAG 4.1.3)

Typing in search (`app/ui/search.tsx:15-25`) re-renders
`CrossEntitySearchResults`, but its group headings ("Incantesimi (6)",
`CrossEntitySearchResults.tsx:108-109`) have no `aria-live` ancestor. The same
applies to the list pages' "361 di 361 incantesimi trovati" counter.
**The fix, in shape:** put the count in a `role="status"` element.

**Resolution:** Wrapped just the numeric count inside each search group's
`<h2>` in a `<span role="status">`, so a screen reader announces the changed
number without re-announcing the whole heading. `ListPage.tsx`'s "N of M
found" counter div now carries `role="status"` directly (it holds nothing
but the count). Unit tests added to `CrossEntitySearchResults.test.tsx` and
a new `ListPage.test.tsx` (the component had none before).

### TD-136 ✅ Admin row buttons all announce as "Modifica" / "Elimina" — **DONE (2026-09-17)**

**Severity:** 🟡 Medium · **Effort:** S · **Found:** 2026-09-17, accessibility review (WCAG 2.4.6, 4.1.2)

`EntityList.tsx:203-215` passes `t("common.table.edit")` and
`DeleteButton.tsx:49` passes `t("form.delete")`, with no item name. The name
reaches only the confirm modal's title. In a screen reader's button list, every
row reads the same. **The fix, in shape:** add an `aria-label` carrying the
item's name (new keys like `common.table.editItem` with `{name}`, in both
catalogues). Pairs naturally with TD-118's move to icon buttons.

**Resolution:** Added `common.table.editItem`/`deleteItem` (`{name}`) to both
catalogues, an `ariaLabel` prop on `ModalButton` (falls back to no
`aria-label`, i.e. `buttonLabel` stays the accessible name, when omitted),
and wired it from `EntityList` (edit) and `DeleteButton` (delete). Unit
tests added/extended in `ModalButton.test.tsx`, `DeleteButton.test.tsx` and
`EntityList.test.tsx`. Checked every e2e spec that locates these buttons by
`getByRole('button', { name: messages.common.table.edit | form.delete })`
(all row-scoped, e.g. via `rowFor(...)`) against Playwright's actual name
matching (`queryRole` in `playwright-core`'s `coreBundle.js`): without
`exact`, `name` matches case-insensitively as a **substring**, so
"Modifica" still matches the new "Modifica Fireball" — no spec needed
updating. `pnpm test:e2e` itself was not run (per the working brief, to
keep :3000 free for parallel agents), so this is a static read of the
matching logic, not an executed confirmation.

### TD-137 ✅ No `nav` landmark around the sidebar — **DONE (2026-09-17)**

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-17, accessibility review (WCAG 1.3.1)

No page has a `<nav>` or `<header>`: the sidebar (`app/ui/dashboard/sidenav.tsx:12`)
and the layout columns (`app/[locale]/dashboard/[system]/layout.tsx:19-23`)
are plain `<div>`s. `<main>` exists. **The fix, in shape:** wrap the nav links
in `<nav aria-label=…>` (a new catalogue key). No visual change.

**Resolution:** `NavLinks` renders a `Fragment` of sibling `<div>`s (each a
flex item alongside the spacer, `LocaleSwitcher` and the sign-out form), so
wrapping only `<NavLinks />` in a `<nav>` would have regrouped those flex
items and changed the sidebar's mobile row layout. Instead, the existing div
that already wraps `NavLinks` + spacer + `LocaleSwitcher` + sign-out became
the `<nav>` itself, keeping its `className` byte-for-byte identical — a tag
swap, not a restructure, so there is no visual change. New catalogue key
`common.nav.sidebarLabel`. Left the layout columns
(`app/[locale]/dashboard/[system]/layout.tsx:19-23`) as plain divs — the TD's
fix, in shape, named only the sidebar's nav links. Unit test added to
`sidenav.test.tsx`.

### TD-138 ✅ The overview skips from `h1` to `h3` — **DONE (2026-09-17)**

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-17, accessibility review (WCAG 1.3.1)

The dashboard overview goes `h1` "Dashboard" → `h3` card titles, with no `h2`.
axe's `heading-order` rule is tagged best-practice, so `e2e/a11y.spec.ts`'s tag
filter does not catch it. **The fix, in shape:** make the card titles `h2`
(`app/ui/dashboard/cards.tsx`). Consider adding `best-practice` to the a11y
spec's tags once this is clean.

**Resolution:** Card titles are now `<h2>` (`CardWrapper`/`Card` is only
used on the overview page, so there is no other heading to reconcile
against). Unit test added to `cards.test.tsx`. **Did not** add
`best-practice` to `e2e/a11y.spec.ts`'s axe tag list: that tag pulls in
every best-practice rule (`landmark-unique`, `region`,
`page-has-heading-one`, ...) across all eleven scanned pages plus the
campaign/adventure and dialog-scoped scans, not just `heading-order`, and
this change could not run `pnpm test:e2e` to confirm the rest of the app is
clean under it (kept out of the working loop deliberately, to leave :3000
free for other agents running in parallel). Left for whoever can run the
full e2e suite and check.

### TD-139 ✅ Pagination doesn't mark the current page — **DONE (2026-09-17)**

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-17, accessibility review (WCAG 4.1.2)

The active page in `app/ui/components/pagination.tsx:86-96` is a `<div>` with a
blue background and no `aria-current`. **The fix, in shape:**
`aria-current={isActive ? "page" : undefined}`, with a unit test.

**Resolution:** Added `aria-current={isActive ? "page" : undefined}` to
`PaginationNumber`'s active/ellipsis `<div>` branch — only the truly active
page gets `"page"`; the ellipsis (same branch, `position === "middle"`) gets
`undefined`. Unit tests added to `pagination.test.tsx`.

Not covered by this review: `/campaign/2`'s scene editors and the
assign-location modal did not finish loading during the pass. Check both in a
follow-up.

### TD-140 — Delete wording differs between a place's trigger and its confirmation, and deleting a landmark asks nothing

**Severity:** 🟡 Medium · **Effort:** S · **Found:** 2026-09-17, UX copy review

- `geography.popover.delete` is "Rimuovi definitivamente" / "Remove
  permanently", but the confirmation it opens asks "Eliminare «{title}»?" /
  "Delete "{title}"?". The trigger and its confirmation use different verbs.
- That confirmation (`geography.deletePlace.*`) never says the action can't be
  undone, although it cascades to children, NPCs and deities, while the simpler
  `common.deleteButton.confirmDescription` does say so.
- `geography.popover.deleteLandmark` ("Elimina" / "Delete") deletes a landmark
  with no confirmation (`usePOIManager.ts:596-608`). `PlacePopover.tsx:94`
  records this as the existing, unconfirmed behaviour SPEC T7 reused, so it
  may be deliberate.

**The fix, in shape:** use one verb for trigger and confirmation, and add the
"can't be undone" line to `deletePlace`. **Decision needed from the DM:** should
deleting a landmark confirm first? If yes, that is a behaviour change with its
own test, not a copy fix.

### TD-141 ✅ English words left in Italian copy beyond TD-120 — **DONE (2026-09-17)**

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-17, UX copy review

- `spells.subclasses.druidoTerra` / `druidoLuna`: "Druido - Circle della
  Terra" / "Circle della Luna". This looks like TD-33's `Circolo` → `Circle`
  identifier rename leaking into catalogue values. Use "Circolo della …".
- `campaign.emptyState.description` and `adventure.ladder.emptyMessage` say
  "la ladder". Use "la scaletta" (the section itself is already titled
  "Avventure").

**Resolution:** Both fixed as specified in `messages/it.json` — "Circolo della
Terra" / "Circolo della Luna", and "la scaletta" in both
`campaign.emptyState.description` and `adventure.ladder.emptyMessage`. English
catalogue was already correct and untouched.

### TD-142 ✅ Title Case in Italian form titles and buttons — **DONE (2026-09-17)**

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-17, UX copy review

`spells.form.*` and `spells.page.*` capitalise the noun ("Crea nuovo
Incantesimo", "Nessun Incantesimo trovato"), and `deities.form.*` does the same
("Modifica Divinità"), while `deities.page.*`, `magicItems`, `treasure` and
`factions` already use sentence case. **The fix, in shape:** lowercase the two
outliers. A catalogue test that flags mid-string capitals in `it.json`'s
`form.*Title`/`*Button` values would keep them that way.

**Resolution:** Lowercased the noun in `spells.form.*`, `spells.page.newItemButton`,
`spells.page.emptyMessage` and `deities.form.*` in `messages/it.json`. Added
`messages/messages.test.ts`'s "form.\*Title/\*Button values use sentence case,
not Title Case" test: it walks every `it.json` key whose path has a `form`
segment and ends `Title`/`Button`, and fails if any word after the first is
Title Case (a leading capital followed by a lowercase letter) — an all-caps
acronym like "PNG" (`npc.form.createTitle`: "Crea nuovo PNG") passes, since its
second letter is uppercase too, not lowercase.

### TD-143 ✅ NPCs are called "PNG" on the card and "Personaggi conosciuti" on the page it opens — **DONE (2026-09-17)**

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-17, UX copy review

The overview card `common.cards.npc` reads "PNG" and links to `/npc`, whose
title (`npc.page.title`) and nav entry (`common.nav.npc`) read "Personaggi
conosciuti". `npc.page.searchPlaceholder` is "Cerca png...", lowercase, while
every button keeps "PNG". **The fix, in shape:** the card uses the nav label,
and the placeholder becomes "Cerca PNG...".

**Resolution:** `messages/it.json`'s `common.cards.npc` now reads "Personaggi
conosciuti" (matching `common.nav.npc`; English was already "NPCs" in both),
and `npc.page.searchPlaceholder` is "Cerca PNG...". Catalogue-only change —
`common.cards` is also `CrossEntitySearchResults.tsx`'s heading namespace, so
the NPC group heading in cross-entity search results now reads "Personaggi
conosciuti (N)" too, a deliberate, consistent side effect of sharing the key
rather than a second copy to keep in sync.

### TD-144 — `loot.checkOff.label` means different things in it and en

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-17, UX copy review

Italian "Trovato" (found) vs English "Taken". The scene and creature check-offs
agree ("Assegnato" / "Awarded"). **Decision needed from the DM:** which one the
check-off means. "Trovato"/"Found" matches `budget.columns.found`; "Preso"/
"Taken" is the alternative.

### TD-145 — Shared error messages don't say what to do next

**Severity:** 🟢 Low · **Effort:** S · **Found:** 2026-09-17, UX copy review

`common.deleteButton.deleteFailed` ("Errore durante la cancellazione"),
`common.deleteButton.networkFailed` ("Errore di rete") and
`common.checkOff.failed` ("Aggiornamento non riuscito") stop there, while
almost every `geography.*.errors.*` message ends with "Riprova." / "Try
again." **The fix, in shape:** add the same ending in both catalogues
("Eliminazione non riuscita. Riprova." / "Delete failed. Try again.", and so
on). Note TD-125 reuses `deleteFailed` for reorder failures; fix that there.

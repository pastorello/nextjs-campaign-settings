# SPEC-002: Map POI persistence in Postgres

- **Status:** Agreed
- **Date:** 2026-07-31
- **Phase:** 3
- **Related:** TD-14, ROADMAP.md Phase 3 items "Map POIs in the database" and "Multi-campaign support"

---

## 1. Problem

A DM marks locations on the world map — a tavern, a ruin, an NPC's home — while prepping or running a session. Today those markers (`usePOIManager`) live only in the browser's `localStorage`. They vanish on a new device or a cleared cache, cannot be seen by anyone else self-hosting the same instance, and cannot point at the NPC or deity they represent — a marker titled "Shrine of Aerivel" has no link to the actual `deities` row, so the DM re-types the connection from memory every time. The map is an island: the richest part of the app (NPCs, deities) and the most visual part (the map) do not know about each other.

## 2. Goal

POIs survive a server restart, are **global to the instance** — one shared world, authored by the DM — and can optionally reference **exactly one** entity of any linkable type (NPC or deity today; other domains — locations, dungeons, treasure — can be added later without a schema change per type), so clicking a marker can navigate to the entity it represents.

### Ownership model (assumed, not built here)

This app is a **single-DM tool**: one DM account authors the world, with players as future read-only consumers. POIs are therefore **not scoped to a user** — they are instance-global, exactly like spells, NPCs and deities already are. `fetchPois` takes no user parameter and filters by nothing.

This matches what [`ARCHITECTURE.md` §5](../ARCHITECTURE.md) already records: there is no authorisation model, every authenticated user can edit everything, and that is accepted for a single-DM tool. A future multi-DM platform — each DM with their own maps and POIs — is the **Multi-campaign support** entry in [`ROADMAP.md`](../ROADMAP.md) Phase 3, which adds `campaignId` to _every_ entity at once. POIs are not a special case there and must not grow their own private ownership column ahead of that work; doing so would create a second, inconsistent scoping mechanism to unpick later.

## 3. Non-goals

- **Automatic migration of existing `localStorage` POIs.** They are per-browser and not tied to a session; there is no server-side way to discover them. The existing `exportGeoJSON` / `importGeoJSON` functions already let a DM export their current markers and re-import them once this ships — that manual path is sufficient and is not being replaced.
- **Multi-user editing semantics** (locking, conflict resolution). This is a single-DM self-hosted tool; last write wins, same as every other domain in this app.
- **A full CRUD list page under the metadata layer** (`app/lib/config/`, `PageMeta`, filters). A POI is a map annotation edited from `MapPOIPanel`, not a browsable catalogue like spells or magic items — it does not belong in `pagesConfig`.
- **Changing `POICategory`** (the 14-value union) or its colours/icons. Out of scope.
- **Rendering the linked entity's data on the map marker** (e.g. showing their portrait in the popup). This spec only adds the link and a click-through; richer marker content is a follow-up.
- **Adding linkable types beyond NPC and deity.** The structure is built to make this cheap later (a new entry in `LINKABLE_ENTITY_TYPES` plus a lookup function, no migration), but this spec ships only the two that exist today.
- **A database-enforced foreign key on the link.** Deliberately traded away by choosing the polymorphic design — see §6.
- **Per-user or per-DM POI ownership.** POIs are instance-global (see §2). No `userId`, no `campaignId`, no ownership filtering — that arrives for every entity at once with multi-campaign support, not for POIs alone.
- **A player-facing read-only map.** Players consuming the DM's POIs needs the authorisation model that does not exist yet ([`ROADMAP.md`](../ROADMAP.md), "Player-facing read-only view").

## 4. User stories

- As a DM, I want my map markers to persist on the server so that I don't lose them when I switch devices or clear my browser.
- As a DM, I want to link a POI to an NPC or a deity — never both at once — so that clicking the marker takes me straight to that entity instead of me remembering the connection.
- As a DM, I want new kinds of linkable content (locations, dungeons, treasure) to slot into POIs later without every prior POI or the schema needing to change.
- As a DM, I want POIs to keep working exactly as they do today (add, edit, delete, categorize, import/export GeoJSON) so that this change is invisible except for where the data lives.

## 5. Behaviour

**Main flow**

1. DM opens the geography map (`/dashboard/geography`, already behind auth).
2. `usePOIManager` loads POIs from the server instead of `localStorage` on mount.
3. Add / edit / delete in `MapPOIPanel` work exactly as today, but each action now calls a Server Action instead of `setState` + `localStorage.setItem`. The change is **optimistic**: the marker appears, moves or disappears immediately, and the round trip reconciles behind it — so the map keeps the instant feel it has today with `localStorage`.
4. The POI edit form gains a single "Linked entity" control: a type selector (None / NPC / Deity) that, once a type is chosen, reveals a second select populated from that entity's table. Choosing a new type clears any previous selection — the pair is always zero or one link, never two.
5. If a POI has a link, its popup gains a "View NPC" / "View deity" link to that entity's page, labelled from `linkedType`.

**Edge cases**

| Situation                                                                        | Expected behaviour                                                                                                                                                                                                                                                                                        |
| -------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty state (no POIs yet)                                                        | Same empty-state UI the panel already shows; list simply starts empty from a fresh `SELECT`.                                                                                                                                                                                                              |
| Validation failure (e.g. bad category, a coordinate that is not a finite number) | Server Action returns `MutationResult`-style field errors; panel shows them inline, does not close.                                                                                                                                                                                                       |
| `linkedType` set but `linkedId` missing, or vice versa                           | Rejected at the Zod boundary — the two fields are validated as a pair (`.refine`): both present or both absent. Never a half-link.                                                                                                                                                                        |
| `linkedType` outside `LINKABLE_ENTITY_TYPES`                                     | Rejected at the Zod boundary (`z.enum`), same as an invalid `category` today.                                                                                                                                                                                                                             |
| Linked NPC or deity is later deleted                                             | No DB-level cascade (no FK — see §6). The POI keeps its stale `linkedId`; resolving it at read time finds nothing and the UI renders the marker as unlinked, the same way `buildResultSchema` already degrades a drifted Prisma result rather than throwing.                                              |
| Unauthenticated request reaches the action                                       | `requireSession()` throws `UnauthorizedError` before any Prisma call, same as every other mutation.                                                                                                                                                                                                       |
| Optimistic write fails (validation, auth, network, DB down)                      | The optimistic marker is **rolled back** — it disappears again, or reverts to its previous position/values — and a `sonner` toast reports the failure, matching how the rest of the app surfaces mutation errors (TD-10). A marker must never be left on the map representing a row that was not written. |
| GeoJSON import of a large file                                                   | Unchanged from today — `poiGeoJSONSchema` still validates client-side before any POI is created server-side. Imported POIs have no link (GeoJSON has no linkable-entity concept); linking happens afterward, in the app.                                                                                  |
| Concurrent edit (two tabs)                                                       | Last write wins; not handled specially (see Non-goals).                                                                                                                                                                                                                                                   |

## 6. Data model changes

```prisma
model poi {
  id          Int      @id @default(autoincrement())
  title       String
  description String?
  lat         Float
  lng         Float
  category    String
  linkedType  String?
  linkedId    Int?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([linkedType, linkedId])
}
```

No `@map` on `linkedType`/`linkedId`: `@map` exists in this schema to decouple English fields from legacy Italian columns (`name String @map("nome")`). `poi` has no legacy column to decouple from — it's a new table — so its fields keep their camelCase names straight through to Postgres, the same way `createdAt`/`updatedAt` already do on every model. Introducing snake_case here would be a second, unprecedented column-naming convention for no reason.

**Polymorphic, not a per-type FK.** `linkedType` + `linkedId` together identify "NPC #7" or "deity #3" without a dedicated column per entity kind. This is the deliberate trade-off from the earlier discussion:

- Adding a new linkable type later (`"location"`, `"dungeon"`, `"treasure"`) is a code change (add the type to `LINKABLE_ENTITY_TYPES`, add a lookup function) with **no migration** — every existing POI row is already shaped to hold it.
- The cost: **Postgres cannot enforce that `linkedId` actually exists** in the table `linkedType` names — there is no real foreign key, because a single column can't point at more than one table. Referential integrity for the link moves entirely to the application (see the "linked entity deleted" edge case above). This mirrors how `category` is already validated only at the Zod boundary, not by a DB enum — the codebase already accepts this trade-off for POI's category field.
- `linkedType` and `linkedId` are validated as a pair (`.refine()` in the Zod schema): both present, or both absent. Never one without the other. Both fields are `.nullable()`, not merely `.optional()` — Prisma's own `update` distinguishes "omit the key" (leave the column untouched) from "send `null`" (clear it), so clearing an existing link on an edit means the panel must submit `linkedType: null, linkedId: null` explicitly, not simply drop the keys.
- `LINKABLE_ENTITY_TYPES` (new, `app/modules/maps/constants/`) is the single source of truth for what `linkedType` can hold and how to resolve it — one entry per type, each naming its Prisma model and a `findUnique`-style lookup, structurally parallel to how `POI_CATEGORIES` is the single source of truth for `category`.

`category` itself is unchanged from the original draft: a plain `String` validated against `POI_CATEGORIES` ids at the application boundary.

New table/column names use English identifiers per ADR-0005; this is new code, not a rename, so `TD-33`'s "no opportunistic renames" restriction doesn't apply here.

- **Backfill needed?** No — this is a new, empty table. See Non-goals for why existing `localStorage` data is not auto-migrated.
- **Reversible?** Yes, a straight `DROP TABLE poi` — nothing else references it, by construction (that's the point of the polymorphic design).

## 7. Metadata changes

None. POIs are deliberately kept outside `PageMeta` / `pagesConfig` (see Non-goals) — they are edited through `MapPOIPanel`'s own form, which already exists and is not being rebuilt.

## 8. Acceptance criteria

- [ ] POIs created in one browser session are visible after a server restart and from a different browser, same session/login.
- [ ] A POI can be created with no link (`linkedType`/`linkedId` both absent), matching today's behaviour exactly.
- [ ] A POI can be created or edited linked to exactly one NPC, or exactly one deity, never both — the UI structurally prevents selecting two, and the Zod schema rejects a payload that somehow has both.
- [ ] A payload with `linkedType` set and `linkedId` missing (or vice versa) is rejected with a field error.
- [ ] A payload with `linkedType` outside `LINKABLE_ENTITY_TYPES` is rejected with a field error.
- [ ] Deleting a linked NPC or deity does not delete or break the POI; the marker renders as unlinked afterward (no crash, no stale link shown as valid).
- [ ] `addPOI` / `updatePOI` / `deletePOI` reject an unauthenticated request.
- [ ] `addPOI` / `updatePOI` reject invalid input (bad category, a coordinate that is not a finite number) with field-level errors, and the panel surfaces them without closing.
- [ ] Coordinates anywhere inside the maps' declared image bounds are accepted. **These are image-space, not geographic.** The geography page declares bounds up to `[[0, 0], [1000, 1333]]`, so validating against Earth's ±90/±180 rejects essentially every real POI — it did, until a round-trip against the live database caught it.
- [ ] `exportGeoJSON` / `importGeoJSON` still work unchanged (manual migration path from old `localStorage` data stays viable).
- [ ] A POI created by one logged-in session is visible to every other logged-in session — POIs are global, not per-user.
- [ ] Adding a POI shows its marker immediately, without waiting for the server round trip.
- [ ] A failed write rolls the optimistic marker back and reports the failure; no marker is left representing an unwritten row.
- [ ] Adding two POIs in quick succession produces exactly two markers, each with its real database id.
- [ ] Coverage has not dropped.

## 9. Implementation plan

_Fill in after the sections above are agreed._

**Files touched, in order**

| #   | File                                                           | Change                                                                                                                                                                      |
| --- | -------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `prisma/schema.prisma`                                         | Add `poi` model (no relations — polymorphic, see §6)                                                                                                                        |
| 2   | migration                                                      | `pnpm prisma migrate dev --name add_poi_table`                                                                                                                              |
| 3   | `app/modules/maps/constants/linkable-entities.ts`              | `LINKABLE_ENTITY_TYPES`: one entry per type (`"npc"`, `"deity"`), each with a label and a Prisma lookup function                                                            |
| 4   | `app/lib/definitions/interfaces/maps/Poi.ts`                   | Server-side POI interface (`linkedType: LinkableEntityType \| null`, `linkedId: number \| null`, etc.)                                                                      |
| 5   | `app/lib/data/validation/poiSchema.ts` or reuse existing       | Zod schema for create/update payloads, with the `linkedType`/`linkedId` pair `.refine()`d together                                                                          |
| 6   | `app/lib/data/maps/createPoi.ts`                               | Server Action: `requireSession`, validate, `prisma.poi.create`                                                                                                              |
| 7   | `app/lib/data/maps/updatePoi.ts`                               | Server Action: same shape, partial update                                                                                                                                   |
| 8   | `app/lib/data/maps/deletePoi.ts`                               | Server Action: `requireSession`, `prisma.poi.delete`                                                                                                                        |
| 9   | `app/lib/data/maps/fetchPois.ts`                               | Read function used on map page load; resolves each `linkedType`/`linkedId` pair via `LINKABLE_ENTITY_TYPES`, degrading a missing target to unlinked                         |
| 10  | `app/modules/maps/hooks/usePOIManager.ts`                      | Replace `localStorage` read/write with the four functions above                                                                                                             |
| 11  | `app/modules/maps/components/map/MapPOIPanel.tsx`              | Add the type-selector + entity-selector pair to the add/edit form                                                                                                           |
| 12  | `app/modules/maps/types/poi.ts`                                | Add `linkedType`/`linkedId` to the client `POI` type                                                                                                                        |
| 13  | tests                                                          | Mutation guards, `.refine()` pair-validation cases, `usePOIManager` (mock the actions instead of `localStorage`), a case for "linked entity deleted → resolves to unlinked" |
| 14  | `docs/TECH_DEBT.md`, `docs/ROADMAP.md`, `docs/ARCHITECTURE.md` | Close out TD-14, update the data model summary                                                                                                                              |

**Risks**

- `usePOIManager`'s current API is synchronous (`addPOI` returns a `POI` immediately). Server Actions are async, so callers in `MapMain.tsx` / `MapPOIPanel.tsx` change shape even though the _user-visible_ behaviour stays instant via the optimistic path. The subtle part is **id reconciliation**: today's client-generated `poi-<timestamp>-<random>` id is replaced by the DB's autoincrement `Int`, so the optimistic marker holds a temporary id until the action returns the real one. `markersRef` is keyed by that id — swapping it mid-flight is where a bug would hide (a duplicated or orphaned marker). Worth a test that adds two POIs in quick succession.
- **No DB-level referential integrity on the link** — accepted trade-off, see §6. Every read path that resolves a link must handle "not found" gracefully; missing that in one place (e.g. a future feature that trusts `linkedId` blindly) would be a real bug, not a cosmetic one.
- `POICategory` has no DB-level enum either; a typo in `category` is only caught by the Zod boundary, not by Postgres. Pre-existing trade-off, not new here.

**Resolved questions** _(both answered 2026-07-31, when this spec moved to Agreed)_

- **Scope: global.** `fetchPois` is not scoped to a user — one DM authors one shared world. See §2 for the ownership model and why POIs must not grow a private scoping column ahead of multi-campaign support.
- **Optimistic UI: yes.** `usePOIManager` keeps its snappy feel via optimistic state — the marker appears immediately, the Server Action reconciles behind it. See §5 for the rollback behaviour this obliges.

  **Implemented with manual optimistic state, not React's `useOptimistic`** (this spec recommended the latter before the code was read). `useOptimistic` reverts to a "real" state that something else refreshes — in practice a Server Component re-rendering after `revalidatePath`. There is no such thing on this route: `app/[locale]/dashboard/geography/page.tsx` is `"use client"`, and every component below it, so `usePOIManager` owns the list outright and no server render flows back into it. `useOptimistic` there would revert each change to a value that never updates. The hook therefore applies the change, keeps the previous value, and restores it on failure. Adopting `useOptimistic` properly would mean moving the POI read into a Server Component and threading it down — a larger change than TD-14, and not one this item needs.

**Open questions**

- None. Ready to implement.

## 10. Task breakdown

- [x] **T1** — Add `poi` Prisma model + migration _(test: migration applies cleanly on a throwaway DB, `pnpm prisma studio` shows the table)_
- [x] **T2** — `LINKABLE_ENTITY_TYPES` + Zod schema with the paired `linkedType`/`linkedId` `.refine()` _(test: both-present passes, one-without-the-other rejected, unknown type rejected)_
- [x] **T3** — `createPoi` / `updatePoi` / `deletePoi` / `fetchPois` Server Actions, with auth + validation _(test: mutation guard tests — unauthenticated rejected; invalid payload rejected with field errors; valid payload writes and reads back; deleted-target resolves to unlinked)_
- [x] **T4** — Wire `usePOIManager` to the new actions with optimistic state, drop `localStorage` code _(test: existing `usePOIManager.test.ts` updated to mock the actions; add/update/delete/clear all still work; a rejected action rolls the optimistic entry back; two rapid adds settle to two entries with their real ids)_ — **done**, 13 tests. Four things it settled that are easy to undo by accident:
  - **`POI.id` stays a client key and is never reassigned.** The server id lives in a ref keyed by it. Swapping the id when the create lands — the design this spec assumed — orphans the marker, because `markersRef` is keyed by that id. The stable key removes the failure mode instead of managing it.
  - **Per-POI operation chaining.** Deleting a POI whose create is still in flight is reachable by hand; chaining each POI's work onto its own predecessor means the delete runs after the create and reads the id it deposited.
  - **A generation guard on `renderMarkers`.** It is async and clears every marker before rebuilding, so two overlapping runs left untracked markers on the map. Server round-trips make overlap far likelier than `localStorage` did.
  - **`fetchPois` is a Server Action and therefore needs `requireSession()`.** The page is client-only, so the read has to be callable from the browser — which makes it a POST endpoint the proxy does not cover, exactly TD-01's hole. The other `fetchFiltered*` readers do not need this because only Server Components call them.
- [x] **T5** — Add the type-selector + entity-selector pair to `MapPOIPanel`'s add/edit form _(test: component test or e2e — selecting NPC then switching to Deity clears the NPC choice; saving and reopening shows the link persisted)_ — **done**. One file this needed that the implementation plan above didn't list: `app/lib/data/maps/fetchLinkableEntities.ts`, a `requireSession()`-guarded Server Action returning `{id, name}[]` for a type, since the entity selector has to populate from real NPC/deity rows and the geography page is client-only (same reasoning as `fetchPois`). Verified against the live database: selecting "NPC" populates the second select with all 119 real rows, alphabetised; a create with `linkedType: "npc"` followed by an update setting both fields to `null` round-trips correctly (link set, then explicitly cleared) — the exact payload shape `MapPOIPanel.handleSave` now sends.
- [x] **T6** — Marker popup gains the "View NPC"/"View deity" link when present _(test: e2e — clicking it navigates to the right entity page)_ — **done**. There is no per-entity detail route for NPCs or deities (confirmed: only flat list pages exist). The link instead uses the metadata layer's existing exact-match `id` filter — `?id=<id>` — already supported by every `PageType` through `getQuery.ts`'s `whereClause[item] = value` handling, just never previously linked to from anywhere. `LinkableEntityTypeConfig` gained a `path` field (`LINKABLE_ENTITY_TYPES` in `linkable-entities.ts`) holding each type's list-page base path, so `usePOIManager.createMarker` builds `${path}?id=${linkedId}`. One thing the e2e spec had to work around: `WorldMap.tsx` (the component actually mounted at `/dashboard/geography`, not the unused `MapMain.tsx`) has `MapSearchBar` commented out, so `MapPOIPanel` is only reachable via the right-click "Add to My Places" flow — there's no way to reopen the panel after navigating away, which is why `e2e/map-poi-link.spec.ts` cleans up the NPC it creates but not the POI.
- [ ] **T7** — Docs: close TD-14 in `TECH_DEBT.md`, update `ROADMAP.md` and `ARCHITECTURE.md`'s data model section

## 11. Outcome

_Fill in at close._

- Shipped: —
- Deviations from spec and why: —
- Follow-up debt created: —

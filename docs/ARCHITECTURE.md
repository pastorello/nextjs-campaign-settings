# Architecture

**Last updated:** 2026-08-13

This document describes how Campaign Settings is put together today, and marks the places where the intended design and the current implementation diverge. Divergences are tagged **[GAP]** and tracked in [`TECH_DEBT.md`](./TECH_DEBT.md).

---

## 1. High-level shape

Campaign Settings is a Next.js App Router application with no separate backend. Server Components read directly from Postgres through Prisma; Server Actions write to it. There is no REST API layer for domain data. The route handlers are one DELETE endpoint per domain (spells, magic items, NPCs, deities and — since SPEC-006 — factions), two read-only GeoJSON endpoints for the map, and — since [ADR-0008](./adr/0008-map-image-storage.md) — two for map images: an authenticated `GET` that streams an uploaded map, and the upload endpoint itself. `find app/api -name route.ts` is the current list.

```
Browser
  │
  ├── RSC payload ────────► Server Components ──► Data layer ──► Prisma ──► Postgres
  │                      (app/[locale]/dashboard/**)  (app/lib/data)
  │
  ├── Server Action POST ─► Mutations ───────────► Prisma ──► Postgres
  │                          (createX/updateX)
  │
  └── fetch() ────────────► Route handlers ──────► Prisma / GeoJSON files
                             (app/api/**)
```

Auth is enforced by `proxy.ts` (Next.js 16's renamed middleware) at the edge, before any of the above runs.

---

## 2. The metadata layer

This is the core abstraction of the project and what distinguishes it from a generic CRUD scaffold. One declaration per field drives form rendering, list display, filtering, sorting and query construction.

### The declaration

Every field is a `PageMeta` object:

```ts
{
  metaField: "level",                 // English identifier, Italian label — ADR-0005
  label: "Livello",
  defaultValue: 0,
  fieldType: FieldType.integer,       // integer | string | boolean | array
  controlType: ControlType.Select,    // Text | Textarea | Select | Multiselect | Checkbox
  options: levels,                    // SelectOption[] for select controls
  validator: z.number().int(),        // Zod schema
  getDatum: (datum) => getDataLabel(levels, datum),  // value → display label
}
```

Since TD-08 this is a **discriminated union on `fieldType`**, so `defaultValue`, `validator`, `options` and `getDatum` are correlated with it: `fieldType: FieldType.array` with `validator: z.string()` no longer compiles.

### The composition chain

```
app/lib/config/spells/SpellsMeta.ts     one file per domain, keyed by SpellMetaField enum
app/lib/config/deity/deityMeta.ts
app/lib/config/npc/npcMeta.ts
app/lib/config/magicitem/magicItemMeta.ts
                    │
                    ▼  spread into a flat registry, plus shared fields (id, name, description)
app/lib/config/pageMetaFields.ts        `satisfies Record<string, PageMeta>` — the
                    │                    literal type survives, so MetaConfigKey is
                    │                    the union of the real field names
                    ▼  ordered per page
app/lib/config/pagesConfig.ts           Record<PageType, MetaConfigKey[]>
                    │                    keys, not values — see the note below
    ┌───────────────┼───────────────┬──────────────────┐
    ▼               ▼               ▼                  ▼
  Forms          Lists           Filters            Queries
  EntityForm     EntityList      useFilterController getQuery.ts
  PageForm       EntityLibrary                       → Prisma where/orderBy
  InputComponent SortableHeader
```

### Consumers

| Consumer               | File                                                      | What it uses                                                     |
| ---------------------- | --------------------------------------------------------- | ---------------------------------------------------------------- |
| Form rendering         | `app/ui/forms/PageForm.tsx` → `inputs/InputComponent.tsx` | `controlType`, `label`, `placeholder`, `defaultValue`, `options` |
| Value display          | `app/ui/components/ItemMeta.tsx`, `XxxCard.tsx`           | `getDatum`                                                       |
| List columns & sorting | `app/ui/components/EntityList.tsx`, `SortableHeader.tsx`  | `label`, `metaField`, via `listConfig`                           |
| Filtering              | `app/lib/hooks/useFilterController.ts`                    | `fieldType`, `options`                                           |
| Query building         | `app/lib/data/getQuery.ts`                                | `fieldType` → `hasSome` for arrays, equality otherwise           |

### The `validator` is executed (TD-02)

Every `PageMeta` carries a Zod schema, and since TD-02 those schemas actually run. `app/lib/data/validation/buildEntitySchema.ts` composes them per entity:

- `buildCreateSchema(pageType)` — the full payload, every declared field required.
- `buildUpdateSchema(pageType)` — the same fields made optional, plus a required positive `id`, because an update only carries the fields the user edited.

Each `create*` / `update*` mutation `safeParse`s first and returns a `MutationResult` — `{ ok: true }`, or `{ ok: false, errors }` carrying Zod's field-keyed map, which the domain forms render through `FormErrorSummary`. Nothing reaches Prisma on failure. Route `:id` segments go through `parseIdParam`, which returns 400 rather than letting `parseInt("abc")` reach a query as `NaN`.

**Note for anyone extending this:** the schema is keyed by each field's real name, and since TD-08 that key is compiler-verified — `MetaConfigKey` is the union of the actual registry keys, so a wrong one is a compile error rather than a filter that silently stops filtering. `buildEntitySchema` reads `pagesConfig` directly; the duplicate field list TD-02 had to carry as a workaround is gone.

> **What this note used to say, because the failure mode is instructive.** It read
> that `metaField` was unreliable (camelCase where the key was lowercase) and that
> `pagesConfig` "is unimported and nine of its entries resolve to `undefined`".
> Both were true when written and both were fixed by TD-08: `pagesConfig` now
> holds keys instead of values, has three importers, and every entry is checked.
> The `sottoclassi` field the old text used as its example no longer exists — it
> was an unpopulated duplicate of `circle`, removed by TD-26 and dropped from the
> database by TD-11.

**Still unvalidated (TD-02b):** environment variables, GeoJSON files and the `as` casts on Prisma results. (POIs moved to Postgres and are now Zod-validated at the Server Action boundary, same as every other mutation — TD-14.)

### ✅ Closed: `PageMeta` was loosely typed (TD-08)

This was the largest **[GAP]** in this document. `getDatum` and `validator` were typed against `any`/broad unions, so `fieldType: FieldType.array` with `validator: z.string()` compiled fine.

`PageMeta` is a discriminated union on `fieldType` now, the registry keys survive inference, `getQuery` is generic over the Prisma where type, and **the `any` count is zero** with `no-explicit-any` enforced as an error. Turning the union on surfaced four real defects no test would have caught — eight deity fields declared `integer` while defaulting to `""`, two call sites passing the wrong type to `getDatum`, a dead tutorial field, and a `SelectOption.value` that could not express a numeric default.

---

## 3. Data access layer

`app/lib/data/<domain>/` holds one function per operation, one per file:

```
fetchFilteredSpells.ts   list + filter + sort + paginate
getSpellsCount.ts        total for pagination
createSpell.ts           "use server"
updateSpell.ts           "use server"
deleteSpellById.ts       plain function, called from the route handler
```

Shared helpers:

- `getQuery.ts` — turns validated search params + a list of enabled meta fields into a Prisma `{ where, skip, take, orderBy }` object.
- `validateParams.ts` — Zod-validates and coerces the raw `searchParams` record.
- `getItemsCount.ts` — generic count.

`connections/prisma.ts` (the Prisma singleton) is the **only** database connection. TD-06 removed the parallel raw-`postgres` driver — `connections/sql.ts`, the inline client in `auth.ts`, and `app/lib/data.ts` — so `DATABASE_URL` is now the single connection string.

### ✅ Closed: pagination read the table twice with independently built queries (TD-12)

`fetchFilteredX` and `getXCount` each carried their own copy of the filterable-field list, and **two of the four had already diverged** — the spell count was missing `name`, and the NPC count listed four of the twelve fields the NPC fetch used. The effect was reachable by editing a URL: `?title=Arcivescovo` reported "119 di 119" above zero rows, with pagination offering thirteen pages of nothing.

The list is declared once in `app/lib/config/queryFields.ts` and read by both. A shared `where` clause was preferred over `prisma.$transaction([findMany, count])` because TD-30 moved the rows behind a `<Suspense>` boundary so they stream, while the count is awaited in the page for the header — one transaction would give that up.

---

## 4. Presentation layer

```
app/ui/
├── containers/ListPage.tsx      generic list page shell
├── forms/
│   ├── PageForm.tsx             metadata-driven form
│   ├── EntityForm.tsx           generic form shell (state, submit, errors, buttons)
│   └── inputs/                  TextInput, TextareaInput, CheckboxInput, Select
├── components/                  Modal, Spinner, pagination, Icon, ItemMeta,
│                                EntityList, EntityLibrary
├── buttons/BaseButton/          variant/size/state-driven button
├── <domain>/                    XxxCard + the form's field layout  (×4 domains)
└── dashboard/                   sidenav, nav-links, cards
```

### ✅ Closed: the per-domain quartets were ~80% duplicated (TD-09)

Each domain used to carry a near-identical `XxxCard` / `XxxList` / `XxxLibrary` / `XxxForm`. Three generic components replaced them, driven by declarations in `app/lib/config/` (`listConfig`, `formFields`): **`EntityList`** for the admin tables, **`EntityLibrary`** for the public card lists, **`EntityForm`** for the form shells — 444 lines of list code and four page-manager hooks (421 lines) deleted.

**The field layout deliberately stays per-domain.** Encoding a field arrangement as configuration would move CSS into data; what was removed is the boilerplate around it. The duplication had already cost six real defects, all found by putting the copies side by side — including a deities column reading the wrong field through the wrong metadata, and the mount effect that silently filtered the spell list ([[TD-27]]).

`app/lib/hooks/usePageManager.ts` is now the single hook owning form state; the four per-domain wrappers are gone.

### The maps module

`app/modules/maps/` is deliberately self-contained and does not participate in the metadata system:

```
modules/maps/
├── components/map/       LeafletMap, LeafletMarker, LeafletGeoJSON, LeafletTileLayer,
│                         MapControls, MapSearchBar, MapPOIPanel, MapDetailsPanel,
│                         MapMeasurementPanel, MapContextMenu, MapErrorBoundary
├── components/ui/        drawer, dropdown-menu, sonner
├── contexts/             MapContext, ThemeContext
├── hooks/                useLeafletMap, useMapMarkers, useMapControls, useMeasurement,
│                         usePOIManager, useGeolocation, useSafeMapOperations, useTheme
├── constants/            map-config, poi-categories, tile-providers, linkable-entities
└── types/                map, poi, theme, components
```

This is the best-structured area of the codebase — error boundary, defensive hook wrapper, typed constants, clean separation. **Use it as the reference standard when refactoring the other domains.**

**The world tree is now split into `zone` (containment) and `poi` (landmark leaf)** (SPEC-008; [ADR-0010](./adr/0010-entity-location-as-stored-reference.md), amending SPEC-004's single polymorphic table, [ADR-0009](./adr/0009-world-tree-as-one-polymorphic-table.md)). `zone` holds every navigable place — the universe root, planes, regions, cities — self-referential via `parentId` (`onDelete: Restrict`) for containment, and carries its own map (`mapImage`/`mapBounds`/`mapInitialView`/`mapInitialZoom`). `poi` is now landmark-only (an inn, a shrine): no `parentId`, no children, `zoneId` required. Neither table has a `kind`-discriminated entity pin anymore, and `poi` no longer has a `linkedType`/`linkedId` pair — a landmark linking to an entity (TD-14/SPEC-002) was dropped as part of the split (confirmed with the maintainer 2026-08-08). `LINKABLE_ENTITY_TYPES` (`constants/linkable-entities.ts`) survives repurposed: it now backs the assignment modal's domain picker (which entity type to attach a location to), not the old POI-links-to-entity feature.

POIs are persisted in Postgres, not `localStorage` — `usePOIManager.ts` writes through `createPoi` / `updatePoi` / `deletePoi` / `fetchPois` (`app/lib/data/maps/`) with optimistic client state.

**A record's location is stored, not derived.** `npc`/`deities` carry `zoneId`/`poiId` directly (nullable FKs, independent rather than mutually exclusive — see ADR-0010), set by a two-step assignment modal (Zone required, POI optional, scoped to the chosen Zone) reachable from both the admin list and the map. `npc.location`/`deities.location`/`deities.residence` are **gone** — SPEC-004's T5b dropped them and their enum vocabularies on 2026-08-08 (migration `20260808160000_drop_legacy_npc_deity_location_columns`), so the FK pair is the only stored answer now. _(This paragraph said those columns "still exist as columns today, removing them is SPEC-004's T5" until 2026-08-13, five days after the drop and in direct contradiction of `ROADMAP.md`, which recorded T5b as closing the spec.)_ The current answer to "where is this NPC" walks the FK chain rather than a `zone.parentId` pin: `deriveEntityAncestry` (`app/modules/maps/lib/utils/`) takes each entity's `zoneId`/`poiId`, and `fetchDerivedAncestry` (`app/lib/data/maps/`) supplies the `zone`/`poi` rows it walks — the landmark POI's own title first if `poiId` is set, then every `zone` ancestor up to the root, nearest first. `EntityList` merges the result into the NPC/deity admin lists as a `derivedLocation` column: declared in `pageMetaFields` so the existing list-rendering machinery can render it, but deliberately absent from every `pagesConfig` entry, so `buildEntitySchema` never treats it as part of the writable payload — read-only by construction, not convention. The admin list's `location` field also sorts (`ORDER BY zone.title`) and filters (two-step Zone→POI, "Sconosciuta" as its own option) on the same `zoneId`/`poiId`.

Places themselves — including the tree's navigable nodes — are **deliberately outside the metadata layer** (`pagesConfig`/`formFields`/`listConfig`): a place is a map annotation edited from a panel, not a browsable, filterable catalogue page.

---

## 5. Auth flow

```
Request
  │
  ▼
proxy.ts  matcher: everything except /api, /_next/static, /_next/image, favicon.ico, *.png
  │
  ▼
authConfig.callbacks.authorized  →  !!auth?.user  (true / false)
  │                                  (redirects to /login via pages.signIn)
  ▼
Route renders
```

Login: `app/login/page.tsx` → `login-form.tsx` → `authenticate()` server action → `signIn("credentials")` → `auth.ts` `authorize()` → Zod-validate email/password → `getUser()` → `bcrypt.compare`.

### Guards at the boundary (TD-01)

The proxy matcher excludes `/api`, so it cannot cover route handlers or Server Actions. Rather than widen the matcher, TD-01 guards each write path where it lives:

1. **Route handlers** — every DELETE handler calls `requireApiSession()` (`app/lib/auth/requireApiSession.ts`), which returns a 401 `NextResponse` when there is no session. `app/api/countries/**` stays open: it is read-only GeoJSON.
2. **Server Actions** — every `create*`/`update*`/`assign*` mutation calls `requireSession()` (`app/lib/auth/requireSession.ts`), which throws `UnauthorizedError`. _(Deliberately not counted here: this line said "the eight create\*/update\* mutations" until 2026-08-13 — `PROJECT_STATE.md` §5 already corrected the same claim in itself and explains why a hardcoded count on a growing list is the wrong fix; `grep -rl "requireSession()" app/lib/data` is the current list.)_ The five domains' `delete*ById` helpers are internal to their guarded route handlers and are not guarded again — but the maps domain's own deletes (`deletePlace`, `deletePoi`) are Server Actions, not route-handler-internal helpers, and call `requireSession()` directly themselves, the same as a `create*`/`update*` mutation.
3. **`authorized`** stays `!!auth?.user` — it gates the proxy-matched dashboard on login, which is all it needs to do now that the API boundary guards itself. No per-route branching.

### [GAP] Still open: authorisation, not authentication

There is no authorisation model: every authenticated user can edit everything. Acceptable for a single-DM tool today; must be addressed before multi-campaign support.

**The ownership model this assumes**, stated once here because several decisions rest on it: one DM authors one shared world, with players as future read-only consumers. No entity is scoped to a user — spells, NPCs, deities and (per [SPEC-002](./specs/002-map-poi-persistence.md)) map POIs are all global to the instance. A future multi-DM platform, where each DM has their own maps and content, is the **Multi-campaign support** item in [`ROADMAP.md`](./ROADMAP.md): it adds `campaignId` to every entity at once. Do not give any single entity a private `userId` or ownership column ahead of that work — a second scoping mechanism is harder to unpick than none.

---

## 6. Target architecture

The direction of travel, for reference when reviewing changes:

```
Route (Server Component)
  └─ validated searchParams (Zod)
       └─ Data layer function
            ├─ auth() guard on every mutation
            ├─ Zod validation from PageMeta.validator
            └─ Prisma (single shared where-clause for rows + count)

UI
  └─ Generic metadata-driven components (EntityList, EntityCard, PageForm)
       └─ Domain config supplies the difference, not duplicated components
```

Principles to hold to:

1. **One source of truth per field.** If information about a field lives in two places, one of them is a bug waiting to happen.
2. **Validate at the boundary.** Every Server Action and route handler validates its input with the Zod schema already declared in the metadata.
3. **Guard every mutation.** No write path without an `auth()` check.
4. **Make invalid states unrepresentable.** Prefer discriminated unions and `satisfies` over `any` and casts.
5. **The maps module is the quality bar.** Other modules should look like it, not the other way round.

---

## 7. Related documents

- [`PROJECT_STATE.md`](./PROJECT_STATE.md) — inventory and current health
- [`TECH_DEBT.md`](./TECH_DEBT.md) — prioritised debt register
- [`TESTING.md`](./TESTING.md) — test strategy
- [`adr/`](./adr/) — decision records

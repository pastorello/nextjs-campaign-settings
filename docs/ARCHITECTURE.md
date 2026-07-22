# Architecture

**Last updated:** 2026-07-22

This document describes how Campaign Settings is put together today, and marks the places where the intended design and the current implementation diverge. Divergences are tagged **[GAP]** and tracked in [`TECH_DEBT.md`](./TECH_DEBT.md).

---

## 1. High-level shape

Campaign Settings is a Next.js App Router application with no separate backend. Server Components read directly from Postgres through Prisma; Server Actions write to it. There is no REST API layer for domain data — the only route handlers are four DELETE endpoints and two read-only GeoJSON endpoints for the map.

```
Browser
  │
  ├── RSC payload ────────► Server Components ──► Data layer ──► Prisma ──► Postgres
  │                          (app/dashboard/**)   (app/lib/data)
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
  metaField: "livello",
  label: "Livello",
  defaultValue: 0,
  fieldType: FieldType.integer,       // integer | string | boolean | array
  controlType: ControlType.Select,    // Text | Textarea | Select | Multiselect | Checkbox
  options: levels,                    // SelectOption[] for select controls
  validator: z.number().int(),        // Zod schema
  getDatum: (datum) => getDataLabel(levels, datum),  // value → display label
}
```

### The composition chain

```
app/lib/config/spells/SpellsMeta.ts     one file per domain, keyed by SpellMetaField enum
app/lib/config/deity/deityMeta.ts
app/lib/config/png/pngMeta.ts
app/lib/config/magicitem/magicItemMeta.ts
                    │
                    ▼  spread into a flat registry, plus shared fields (id, nome, descrizione)
app/lib/config/pageMetaFields.ts        Record<string, PageMeta>
                    │
                    ▼  ordered per page
app/lib/config/pagesConfig.ts           Record<PageType, PageMeta[]>
                    │
    ┌───────────────┼───────────────┬──────────────────┐
    ▼               ▼               ▼                  ▼
  Forms          Lists           Filters            Queries
  PageForm       XxxList         useFilterController getQuery.ts
  InputComponent SortableHeader                     → Prisma where/orderBy
```

### Consumers

| Consumer | File | What it uses |
|---|---|---|
| Form rendering | `app/ui/forms/PageForm.tsx` → `inputs/InputComponent.tsx` | `controlType`, `label`, `placeholder`, `defaultValue`, `options` |
| Value display | `app/ui/components/ItemMeta.tsx`, `XxxCard.tsx` | `getDatum` |
| List columns & sorting | `app/ui/*/XxxList.tsx`, `SortableHeader.tsx` | `label`, `metaField` |
| Filtering | `app/lib/hooks/useFilterController.ts` | `fieldType`, `options` |
| Query building | `app/lib/data/getQuery.ts` | `fieldType` → `hasSome` for arrays, equality otherwise |

### [GAP] The `validator` is declared but never executed

Every `PageMeta` carries a Zod schema. Nothing calls it. Grep confirms `validator` is never read anywhere in the codebase, and `safeParse`/`parse` appear only in `validateParams.ts` (search params) and in `JSON.parse` calls.

The consequence: `createSpell`, `updateSpell`, `createPng`, `createDeity`, `createMagicItem` and their update counterparts pass client-supplied data straight into `prisma.x.create({ data })` with no validation. The infrastructure to fix this already exists — it just needs to be wired up. See TD-02.

### [GAP] `PageMeta` is loosely typed

`getDatum` and `validator` are typed against `any`/broad unions, so a mismatch between `fieldType: FieldType.array` and `validator: z.string()` compiles fine. A discriminated union on `fieldType` would make invalid metadata unrepresentable — this is the change that would most visibly demonstrate TypeScript skill in a portfolio review. See TD-08.

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

### [GAP] Pagination reads the table twice with independently built queries

`fetchFilteredX` and `getXCount` each construct their filter separately. Any divergence between them yields a page count that does not match the rows. They should share one `where` clause.

---

## 4. Presentation layer

```
app/ui/
├── containers/ListPage.tsx      generic list page shell
├── forms/PageForm.tsx           metadata-driven form
│   └── inputs/                  TextInput, TextareaInput, CheckboxInput, Select
├── components/                  Modal, Spinner, pagination, Icon, ItemMeta
├── buttons/BaseButton/          variant/size/state-driven button
├── <domain>/                    XxxCard, XxxForm, XxxList, XxxLibrary  (×4 domains)
└── dashboard/                   sidenav, nav-links, cards
```

The four domains each have a near-identical `XxxCard` / `XxxList` / `XxxLibrary` / `XxxForm` quartet. **[GAP]** These are ~80% duplicated. Since the metadata layer already knows every field, most of this can collapse into generic `<EntityCard meta={...}>` / `<EntityList meta={...}>` components. This is the largest single reduction in code volume available. See TD-09.

`app/lib/hooks/usePageManager.ts` plus four thin per-domain wrappers (`useSpellPageManager`, …) own list state: query string, filters, sort order, page. The per-domain wrappers differ mainly in which `PageType` they pass.

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
├── constants/            map-config, poi-categories, tile-providers
└── types/                map, poi, theme, components
```

This is the best-structured area of the codebase — error boundary, defensive hook wrapper, typed constants, clean separation. **Use it as the reference standard when refactoring the other domains.**

POIs are persisted to `localStorage` (`usePOIManager.ts`), not to the database. **[GAP]** Map POIs should live in Postgres and relate to `png` / `deities` records — that is the feature that would tie the map to the rest of the app. Tracked as a Phase 3 item in [`ROADMAP.md`](./ROADMAP.md).

---

## 5. Auth flow

```
Request
  │
  ▼
proxy.ts  matcher: everything except /api, /_next/static, /_next/image, favicon.ico, *.png
  │
  ▼
authConfig.callbacks.authorized  →  isLoggedIn ? true : false
  │                                  (redirects to /login via pages.signIn)
  ▼
Route renders
```

Login: `app/login/page.tsx` → `login-form.tsx` → `authenticate()` server action → `signIn("credentials")` → `auth.ts` `authorize()` → Zod-validate email/password → `getUser()` → `bcrypt.compare`.

### [GAP] Three holes

1. **API routes are unauthenticated.** The matcher excludes `/api`, and none of the four DELETE handlers call `auth()`. Any unauthenticated client can delete any spell, NPC, deity or magic item by ID. See TD-01.
2. **Server Actions are unauthenticated.** Server Actions are POST endpoints with a stable ID; `proxy.ts` does not cover them and no mutation calls `auth()`. See TD-01.
3. **`authorized` is all-or-nothing.** `isOnDashboard` and `isApiRoute` are computed and then never used — the callback ignores them and gates every matched path identically. Dead logic that signals an unfinished intent.

There is also no authorisation model at all: every authenticated user can edit everything. Acceptable for a single-DM tool today; must be addressed before multi-campaign support.

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

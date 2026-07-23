# Testing Strategy

**Last updated:** 2026-07-22
**Stack:** Vitest + Testing Library (unit/integration) · Playwright (E2E) · MSW where network mocking is needed
**Decision record:** [ADR-0002](./adr/0002-testing-stack.md)

---

## 1. Where we are

**Migrated to Vitest on 2026-07-22 (TD-03).** `pnpm test` runs 111 tests across 11 files in ~2s. Coverage is **18% lines / 11% branches**, enforced in CI as a ratchet — see §2.

What exists today:

| Suite                                               | Tests | Notes                                                                      |
| --------------------------------------------------- | ----- | -------------------------------------------------------------------------- |
| `app/lib/data/getQuery.test.ts`                     | 18    | Query construction — the highest-value unit tests in the project, per §3   |
| `__test__/api/deleteEndpoints.test.ts`              | 32    | TD-01/TD-02 — 401, malformed `:id` → 400, and the authed path              |
| `__test__/data/mutationValidation.test.ts`          | 20    | TD-02 — valid writes, invalid rejected, field-keyed errors, partial update |
| `app/lib/data/validation/buildEntitySchema.test.ts` | 19    | TD-02 — every declared default passes its domain's schema                  |
| `__test__/data/mutationGuards.test.ts`              | 8     | TD-01 — each mutation throws and never writes without a session            |
| `__test__/auth/session-guards.test.ts`              | 5     | TD-01 — the `requireSession` / `requireApiSession` helpers directly        |
| `__test__/utils/generatePwdHash.test.ts`            | 4     | Rewritten; the old version could never pass                                |
| `app/lib/utils/data/sortByField/index.test.ts`      | 2     | Carried over                                                               |
| `__test__/utils/parseSerializedArray.test.ts`       | 1     | Carried over                                                               |
| `__test__/utils/createEmptyArray.test.ts`           | 1     | Carried over — was never collected before, the filename was malformed      |
| `app/ui/forms/inputs/Select/Select.test.tsx`        | 2     | Carried over                                                               |

**Still missing, and deliberately so:** integration tests against a real Postgres, and the whole Playwright layer. Both are described below and neither is started. The integration tests arrive with TD-01 and TD-02, which is the point of doing this migration first.

---

## 2. Target: what we test and why

Not "100% coverage". Coverage is a diagnostic, not a goal. What matters for this project is that the four things a reviewer would poke at are provably correct:

1. **Nobody can write to the database without a session.** (TD-01)
2. **Invalid input never reaches Prisma.** (TD-02)
3. **The metadata layer produces the right query for a given set of filters.** (the core abstraction)
4. **A user can complete each CRUD flow end to end.**

Everything else is supporting cast.

### The pyramid, sized for this project

```
        ╱  E2E — Playwright  ╲            ~8 specs
       ╱   critical user flows ╲
      ╱─────────────────────────╲
     ╱  Integration — Vitest     ╲        ~30 tests
    ╱   data layer + Server        ╲
   ╱    Actions against a real DB   ╲
  ╱───────────────────────────────────╲
 ╱   Unit — Vitest                     ╲  ~60 tests
╱    pure functions, hooks, components  ╲
─────────────────────────────────────────
```

### Coverage targets

| Area                  | Target  | Rationale                                                                |
| --------------------- | ------- | ------------------------------------------------------------------------ |
| `app/lib/data/**`     | 90%     | Query construction and mutations — the risky part                        |
| `app/lib/utils/**`    | 95%     | Pure functions, trivial to cover                                         |
| `app/lib/config/**`   | 80%     | Metadata correctness is load-bearing                                     |
| `app/lib/hooks/**`    | 70%     | State logic                                                              |
| `app/ui/**`           | 60%     | Behaviour, not markup                                                    |
| `app/modules/maps/**` | 50%     | Leaflet is hard to test headlessly; cover hooks and utils, not rendering |
| **Overall gate**      | **70%** | Enforced in CI, ratcheted upward over time                               |

Set the CI threshold to whatever you actually achieve at the end of Phase 1, then never let it drop. A threshold you have to disable to merge is worse than no threshold.

**Current thresholds are 18/12/11/17 (lines/functions/branches/statements)** — what the suite achieves today, not the targets above. They are a ratchet: raise them whenever a change adds real coverage, never lower them. The table stays the destination.

---

## 3. What each layer covers

### Unit — Vitest + Testing Library

Fast, no I/O, no database.

**Pure functions** (`app/lib/utils/`) — the easiest wins, and they already have a partial suite worth keeping:

- `validators/*` — `isValidString`, `isNumberArray`, `isObjectArray`, `isValidDataArray`, `isKeyOfItem`, … Table-driven tests with `it.each`.
- `data/parseSerializedArray` — malformed JSON, empty string, nested arrays.
- `data/sortByField` — already tested; extend with nulls, mixed types, stable-sort behaviour.
- `data/getDataLabel` — missing value, `shortLabel` fallback.
- `data/getSearchParam`. (The old `setSearchParams` helper was deleted in TD-05 — it was dead and broke `rules-of-hooks`.)

**Query construction** (`app/lib/data/getQuery.ts`) — the highest-value unit tests in the project. `getQuery` is a pure function from `(searchParams, enabledMeta)` to a Prisma query object, so it can be tested exhaustively with no database:

```ts
describe("getQuery", () => {
  it("builds a case-insensitive contains filter from `query`", () => {
    expect(getQuery({ query: "fire" }, [SpellMetaField.nome]).where)
      .toEqual({ nome: { contains: "fire", mode: "insensitive" } });
  });

  it("uses hasSome for array fields", () => { … });
  it("ignores params that fail their field-type validator", () => { … });
  it("computes skip from page and itemsPerPage", () => { … });
  it("falls back to ascending nome ordering", () => { … });
});
```

**Hooks** — `renderHook` from Testing Library for `usePageManager`, `useFilterController`, `useMapControls`, `useMeasurement`, `usePOIManager`.

**Components** — behaviour, not snapshots. Delete `dashboard-snapshot.tsx`: snapshot tests of markup break on every styling change and assert nothing meaningful. Test instead: `Select` opens and reports the chosen value; `PageForm` renders the controls its metadata declares; `pagination` disables at boundaries; `BaseButton` applies the right variant and disabled state.

### Integration — Vitest against a real Postgres

Run against a disposable Postgres (Testcontainers, or a `docker-compose.test.yaml` service) — **not** a mocked Prisma client. Mocking Prisma tests your mock, not your query.

- Each `create*` / `update*` / `delete*` function: happy path, not-found, constraint violation.
- Each `fetchFiltered*`: filtering, sorting, pagination boundaries, empty result.
- `getXCount` agrees with `fetchFilteredX` for the same filter (this is TD-12's regression test).
- **Auth guards** ✅ done in TD-01: every DELETE handler returns 401 and every `create*`/`update*` mutation throws without a session, each with a test (`__test__/api/`, `__test__/data/mutationGuards.test.ts`, `__test__/auth/`). These run without a database — the guard rejects before any query — so they live in the unit suite, not the integration one.
- **Validation** ✅ done in TD-02: every mutation rejects a malformed payload with field-keyed errors and writes nothing, and a malformed route `:id` returns 400. Like the auth guards, these need no database and live in the unit suite.

Each test seeds and truncates its own fixtures. No shared mutable state between tests.

### E2E — Playwright

Chromium in CI; add Firefox and WebKit once the suite is stable. Roughly eight specs, no more — E2E is expensive and each one must earn its place.

| Spec                  | Flow                                                                                                                                 |
| --------------------- | ------------------------------------------------------------------------------------------------------------------------------------ |
| `auth.spec.ts`        | Log in with valid credentials → dashboard. Invalid credentials → error, no redirect. Unauthenticated `/dashboard/spells` → `/login`. |
| `spells-crud.spec.ts` | Create a spell → appears in list → edit → delete → gone.                                                                             |
| `png-crud.spec.ts`    | Same for NPCs (the domain with the most fields).                                                                                     |
| `filtering.spec.ts`   | Apply filter → list narrows → filters survive reload → reset clears them.                                                            |
| `pagination.spec.ts`  | Navigate pages, verify the count matches the rows.                                                                                   |
| `map.spec.ts`         | Map loads, a POI can be placed, tile switching works.                                                                                |
| `validation.spec.ts`  | Submit an empty required field → inline error, nothing written.                                                                      |
| `a11y.spec.ts`        | `@axe-core/playwright` over each main page (supports TD-15).                                                                         |

Use `page.getByRole` / `getByLabel`, not CSS selectors — role-based queries double as accessibility assertions.

### Explicitly out of scope

- Visual regression testing (Percy/Chromatic) — nice, not worth the setup cost yet.
- Load testing — single-user tool.
- Testing Leaflet's own rendering — test our hooks around it.
- Snapshot tests of markup.

---

## 4. Migration from Jest to Vitest — ✅ DONE (2026-07-22)

Kept for the record, and because four steps went differently than written. Deviations, all deliberate:

1. **`vite-tsconfig-paths` was installed and then removed.** Vite resolves tsconfig paths natively now (`resolve: { tsconfigPaths: true }`); Vitest prints a deprecation notice if you use the plugin. One fewer dependency than this plan called for.
2. **Coverage thresholds are 14/9/9/13, not 70/70/60/70.** Setting them at the target would fail CI on day one — the exact failure mode §2 warns about two paragraphs earlier. They ratchet up instead.
3. **Playwright was not installed.** TD-03's exit criterion is a green unit suite enforced by CI; the eight specs in §3 are a body of work in their own right, and `pnpm create playwright` is interactive besides. The CI `e2e` job stays documented-as-unrunnable until someone does it properly.
4. **Tests import from `vitest` explicitly** rather than relying on `globals: true` for typing. Dropping `@types/jest` left `test`/`expect` untyped under `tsc`, and explicit imports fix that without adding a `types` array to tsconfig, which would have overridden the default and pulled the rug on `@types/node`.

Also removed: `__test__/mocks/next/*`, orphaned once Jest's `moduleNameMapper` went away — nothing imported them.

**Original plan below.** Effort was ~2h as estimated.

**1 — Install**

```bash
pnpm remove jest jest-environment-jsdom @types/jest @babel/preset-env @babel/preset-react @babel/preset-typescript
pnpm add -D vitest @vitejs/plugin-react vite-tsconfig-paths jsdom @vitest/coverage-v8
```

**2 — `vitest.config.ts`**

```ts
import { defineConfig } from "vitest/config";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";

export default defineConfig({
  plugins: [react(), tsconfigPaths()],
  test: {
    environment: "jsdom",
    globals: true,
    setupFiles: ["./vitest.setup.ts"],
    include: ["**/*.{test,spec}.{ts,tsx}"],
    exclude: ["**/node_modules/**", "**/e2e/**", "**/.next/**"],
    coverage: {
      provider: "v8",
      reporter: ["text", "lcov"],
      exclude: ["**/*.config.*", "**/generated/**", "app/seed/**", "**/*.d.ts"],
      thresholds: { lines: 70, functions: 70, branches: 60, statements: 70 },
    },
  },
});
```

`vite-tsconfig-paths` makes the `@/*` alias work without duplicating the mapping — one fewer thing to keep in sync than Jest's `moduleNameMapper`.

**3 — `vitest.setup.ts`**

Port `jest.setup.ts`, replacing `jest.mock` with `vi.mock`. The `TextEncoder`/`TextDecoder` polyfills are no longer needed — Vitest's jsdom environment provides them.

**4 — Delete**

`jest.config.ts`, `jest.setup.ts`, `babel.config.js`, `__test__/stubs/` (Vite handles CSS and asset imports natively).

**5 — Port existing tests**

Rename `__test__/utils/createEmptyArraytest..ts` → `createEmptyArray.test.ts` (it was never being collected). Keep `generatePwdHash.test.ts`, `parseSerializedArray.test.ts`, `sortByField/index.test.ts`, `Select.test.tsx`. Delete `dashboard-snapshot.tsx`. The `__test__/mocks/next/*` mocks mostly carry over with `jest.fn` → `vi.fn`.

**6 — Playwright**

```bash
pnpm create playwright
```

Config: `testDir: "./e2e"`, `webServer` pointing at `pnpm dev`, `baseURL: "http://localhost:3000"`, `trace: "on-first-retry"`.

**7 — Scripts**

```json
{
  "typecheck": "tsc --noEmit",
  "lint": "eslint .",
  "test": "vitest run",
  "test:watch": "vitest",
  "test:coverage": "vitest run --coverage",
  "test:e2e": "playwright test",
  "test:e2e:ui": "playwright test --ui"
}
```

---

## 5. Conventions

**Location.** Unit tests sit beside their subject (`sortByField/index.test.ts` — the pattern already in use). Integration tests in `__test__/integration/`. E2E in `e2e/`.

**Naming.** Describe behaviour, not implementation:

```ts
// ✅ it("returns 401 when no session is present")
// ❌ it("calls auth")
```

**Structure.** Arrange–Act–Assert, with blank lines between the three.

**Fixtures.** Factory functions in `__test__/factories/`, with overridable defaults:

```ts
export const makeSpell = (overrides: Partial<Spell> = {}): Spell => ({
  nome: "Palla di Fuoco", livello: 3, circolo: [Circolo.Evocazione], …overrides,
});
```

**No conditional logic in tests.** If a test needs an `if`, it should be two tests.

**One reason to fail.** A test asserting five unrelated things tells you nothing when it goes red.

---

## 6. Definition of done for any change

A change is not complete until:

- [ ] `pnpm typecheck` passes
- [ ] `pnpm lint` passes
- [ ] `pnpm test` passes and coverage has not dropped
- [ ] New behaviour has a test that fails without the change
- [ ] Bug fixes have a regression test reproducing the bug
- [ ] Any change to a user-facing flow has an E2E assertion or an explicit note of why not

---

## 7. Related documents

- [`TECH_DEBT.md`](./TECH_DEBT.md) — TD-03 (broken suite), TD-01/TD-02 (what to test first)
- [`adr/0002-testing-stack.md`](./adr/0002-testing-stack.md) — why Vitest over Jest
- [`../CLAUDE.md`](../CLAUDE.md) — how to ask for tests in AI-assisted sessions

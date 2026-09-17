# ADR-0014: Corrected `revalidatePath` calls behind a single helper

- **Status:** Accepted
- **Date:** 2026-09-17
- **Deciders:** the maintainer (DM), with Claude Code
- **Related:** TD-105 in [`docs/TECH_DEBT.md`](../TECH_DEBT.md) (this closes it); [ADR-0013](./0013-game-systems.md) (the `[system]` segment this path now includes); `app/lib/utils/revalidateDashboard.ts`

## Context

Every dashboard mutation calls `revalidatePath` after writing, so the reader sees the effect in place rather than on a stale page. TD-105 found two independent problems with the original ~48 call sites, both confirmed against a production build and against Next's own reference (`node_modules/next/dist/docs/01-app/03-api-reference/04-functions/revalidatePath.md`), not inferred:

1. **None of the paths were in a form that could match.** Pages live at `app/[locale]/dashboard/[system]/<domain>/page.tsx`. 29 calls passed the _source_ URL built by the `dashboardPath()` helper (e.g. `/dashboard/dnd5e/campaign`) — the reference calls this exact shape out as its "Incorrect" example for a rewritten route, because `revalidatePath` matches route _files_, not browser URLs. 19 more passed a bare domain (`/deities`, `/npc`, …), which matches neither the source URL nor the destination. None passed `type: "page"`, which the reference requires whenever the path contains a dynamic segment — every one of these does, twice over, since [ADR-0013](./0013-game-systems.md) added `[system]` as a second dynamic segment ahead of the domain.
2. **There is no cache for any of them to invalidate, right or wrong.** Every dashboard page reaches `requireSession()` → `auth()` → cookies, which forces dynamic rendering; `pnpm build` marks every route but one `ƒ (Dynamic)`, and a production response carries `Cache-Control: private, no-cache, no-store, max-age=0, must-revalidate`. Inserting a row directly into the database, bypassing every mutation and every `revalidatePath`, changed what the very next request rendered.

TD-105's first draft read (2) as making (1) harmless — "48 calls that do nothing" — and recommended deleting them. That was wrong, corrected in the entry on 2026-09-11 after reading Next's server source rather than guessing from behaviour: `revalidatePath` sets `workStore.pathWasRevalidated` **regardless of whether the path matches anything**, and `action-handler.js` skips re-rendering the page after a Server Action unless that flag is set. The flag, not a cache match, is why the map's in-place refresh (un-placing a place, the inline campaign collections) works today. Deleting the call from `unplacePlace` was tried against `map-unplace.spec`; its count assertion went red. So the calls are load-bearing, and the only real question is what to do about the paths being wrong.

Two ways to keep the refresh, both discussed in TD-105's correction:

- **`refresh()` from `next/cache`** (new in Next 16) sets `ActionDidRevalidateDynamicOnly`, which is a truer description of what these calls actually accomplish today — a refresh, not a cache invalidation. Its one behavioural difference from `revalidatePath`: the client only evicts its prefetch cache on `ActionDidRevalidateStaticAndDynamic`, which `revalidatePath` sets and `refresh()` does not. Whether that changes anything about back/forward navigation is unverified — it needs a browser session against a production build, which the curl-and-cookie probe that confirmed (2) deliberately didn't cover — and changing the pattern for every mutation in the codebase is a bigger move than this ticket's scope.
- **Correct the paths.** Identical behaviour today (the flag is set either way), and right if a cache ever does start applying to these pages (PPR, `use cache`, a static shell) — a corrected path costs nothing now and saves a second pass later. The remaining objection is cosmetic: it's still a call named for cache invalidation whose only present effect is a refresh.

## Decision

**Correct every call to the page's real route-file location, behind one shared helper**, `app/lib/utils/revalidateDashboard.ts`:

```ts
revalidatePath(`/[locale]/dashboard/[system]/${domain}`, "page");
```

`domain` is a `DashboardDomain` union of the segments that exist under `app/[locale]/dashboard/[system]/` (`campaign`, `deities`, `factions`, `geography`, `magicitems`, `npc`, `spells`, `treasures`, `world`) — closed, so a typo is a compile error rather than a call that silently stops refreshing, which is exactly how 19 of the original 48 went unnoticed. Every call site in `app/lib/data/**` now goes through `revalidateDashboard(domain)` instead of importing `revalidatePath` (and, for 29 of them, `dashboardPath` plus `DEFAULT_GAME_SYSTEM`) directly.

`refresh()` is deferred, not rejected — see _Revisit when_. Correcting the paths is the safer move to land now: it needs no behavioural change to verify, and it keeps the option to move to `refresh()` open, contained to one file.

## Alternatives considered

### Delete the calls

TD-105's own first-draft recommendation, and the one its 2026-09-11 correction retracted. Deleting stops the in-place refresh outright — confirmed by pointing `unplacePlace` at a nonsense path and watching `map-unplace.spec`'s count assertion stay green, then deleting the call and watching it go red. Not viable at any point after that observation.

### Switch every call site to `refresh()` now

The technically honest option — these calls have only ever produced a refresh, never a cache invalidation, so a primitive named for a refresh describes what actually happens. Deferred rather than rejected: the one behavioural difference from `revalidatePath` (client prefetch-cache eviction) is unverified against back/forward navigation, verifying it needs a production build and a real browser session rather than the curl probe TD-105 already ran, and this ticket's job was the mechanical correction, not a behavioural change across every mutation in the app. `revalidateDashboard` is deliberately the one place that decision gets made, so switching later touches one file instead of ~50.

### Leave the call sites as direct `revalidatePath` calls, just with corrected arguments, no shared helper

Fixes finding (1) without adding an abstraction. Rejected because it reproduces the exact failure shape TD-105 documents: the free-text path is a string literal at every call site, so the same drift — a typo, or a stale path after a route move — silently stops refreshing again, caught only if a test happens to assert on it. A closed union at one call boundary is cheap and was already the fix TD-19's near-miss (the same class of problem, in `getQuery.ts`) pushed this codebase toward for other string-keyed layers.

## Consequences

**Positive**

- Every dashboard mutation revalidates the page Next will actually reload from, so the correction is real rather than cosmetic the moment any caching applies here.
- A typo in a domain segment is now a `tsc` error, not a filter — or in this case a refresh — that silently stops working.
- `dashboardPath` and `DEFAULT_GAME_SYSTEM` are no longer imported by 29 files purely to build a value `revalidatePath` was never going to accept anyway; each of those files lost two imports it didn't otherwise need.
- The `refresh()` migration, if and when it happens, is a one-file change plus its own verification pass — not another ~50-call-site sweep.

**Negative**

- The call is still named for a cache invalidation it does not perform. This ADR does not resolve that discomfort, only contains it to one helper and records why.
- `DashboardDomain`'s union has to be kept in sync with `app/[locale]/dashboard/[system]/` by hand; nothing generates it from the directory listing.

**Neutral / follow-up work**

- The back/forward check against a production build that would unblock `refresh()` is still open. Whoever picks it up should do it as its own small investigation, not bundled into an unrelated change — see _Revisit when_.

## Revisit when

- **The back/forward behaviour of `refresh()` vs. `revalidatePath` is checked against a production build.** If prefetch-cache eviction turns out not to matter for this app's navigation patterns (no `Link` prefetching across dashboard pages today), `revalidateDashboard`'s single `revalidatePath` call becomes a single `refresh()` call, and every call site is already routed through it.
- **A cache starts applying to dashboard pages** (PPR, `use cache`, a static shell). At that point the corrected paths in this ADR start doing real invalidation work instead of only setting the revalidated flag, which is the scenario this decision was betting on.
- **A tenth dashboard domain is added.** Extend `DashboardDomain` in the same commit as the route; do not let a call site fall back to a raw string to avoid the type.

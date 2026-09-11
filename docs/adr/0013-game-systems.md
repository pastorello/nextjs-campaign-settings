# ADR-0013: Model game systems as a dashboard URL segment and per-system catalogues

- **Status:** Accepted
- **Date:** 2026-09-11
- **Deciders:** the DM (maintainer), with Claude Code
- **Related:** [SPEC-018](../specs/018-game-systems.md), [ADR-0003](./0003-metadata-driven-domain-configuration.md), [ADR-0006](./0006-bilingual-ui.md), [`docs/domain/licensing.md`](../domain/licensing.md), [SPEC-011](../specs/011-cross-entity-search.md), [SPEC-013](../specs/013-campaign-management.md)

## Context

SPEC-018 makes the app hold one world under several game systems: 5e today, then Daggerheart, and Pathfinder 2e later. Four of its decisions are already made, and they constrain this one:

- The world is shared.
- Each campaign picks one system, and the campaign list is filtered by system.
- The active system lives in the URL, because the setting is viewed through a system rather than through a campaign.
- NPCs and deities keep every field, alignment included, under every system — compatibility, not correspondence.

What remains is the mechanism. The facts that matter:

- **Routing today is `app/[locale]/dashboard/**`** with next-intl, `localePrefix: "as-needed"` and Italian as the default. An Italian URL has **no** locale segment (`/dashboard/spells`); an English one does (`/en/dashboard/spells`). `proxy.ts` runs next-intl's middleware and then the auth gate, and it already has to split an optional locale off the path to do so.
- **Dashboard links are hand-written strings** — `"/dashboard/spells"` in `nav-links.tsx`, `cards.tsx`, `CrossEntitySearchResults.tsx` and others — and they are built two ways: 23 files import next-intl's `Link` from `@/i18n/navigation`, while the side navigation uses `next/link` directly. The compiler checks none of these strings.
- **The dashboard layout** (`app/[locale]/dashboard/layout.tsx`) renders `SideNav` around every page. A layout only receives the params of its own segment and the segments above it.
- **The metadata layer** (ADR-0003) is keyed by domain: `app/lib/config/<domain>/`, `pageMetaFields.ts`, `pagesConfig.ts`. Its keys are strings, and a missed key fails silently.
- **Catalogues diverge completely between systems.** A 5e spell and a Daggerheart domain card share a name and a description and nothing else.
- The existing 5e tables — `spells`, `magicitems`, `treasure` — hold years of the DM's data.

## Decision

We will put the game system in the URL as a segment inside the dashboard, `/[locale]/dashboard/[system]/…`. Every dashboard link will be built by one system-aware helper. Each system gets its own catalogue tables, while the world and its shared entities stay single.

In detail:

1. **Vocabulary.** `GameSystem` is a closed vocabulary in code, in `app/lib/definitions/GameSystem.ts`: a `GAME_SYSTEMS` array, the type derived from it, and a type guard. **The values are the URL slugs:** `dnd5e`, `daggerheart`, `pf2e`. A system joins the vocabulary with its first slice, so T2 ships `dnd5e` alone and the switch never offers a system with nothing behind it. `DEFAULT_GAME_SYSTEM = 'dnd5e'`.
2. **URL shape.** The segment sits inside the dashboard: `/dashboard/dnd5e/spells` in Italian and `/en/dashboard/dnd5e/spells` in English. Every page under `app/[locale]/dashboard/` moves under `app/[locale]/dashboard/[system]/`, including the overview, `admin/**`, `campaign/**`, `error.tsx` and `not-found.tsx`. `[system]/layout.tsx` validates the param with the type guard (`notFound()` otherwise) and renders `SideNav`, which needs the system for the switch and for its links.
3. **URLs without a system** (old bookmarks, links in docs, a hand-written link that slipped through). `proxy.ts` gains one step after the locale split. If the segment after `/dashboard` is not a `GameSystem`, it redirects with **307** to the same path with `DEFAULT_GAME_SYSTEM` inserted. The redirect is temporary so that browsers do not cache the default. It is deterministic: no cookie, no "last system used". An unknown system (`/dashboard/foo/spells`) is treated the same way and ends in the page's own 404 (`/dashboard/dnd5e/foo/spells`).
4. **Catalogue pages under the wrong system.** Each `pagesConfig` entry gains an optional `system`; absent means shared. A catalogue page calls one helper that compares its page's `system` with the route param and calls `notFound()` on a mismatch. So `/dashboard/daggerheart/spells` is a 404, not the 5e spells list. A unit test asserts that every page is either shared or belongs to exactly one value of `GAME_SYSTEMS`.
5. **Links.** One helper builds every dashboard path from a system and a path, next to the navigation exports in `i18n/`. Client components get the system from the route params through a hook; server components get it from `params`. next-intl's `Link`, `redirect` and `useRouter` keep handling the locale, and the helper handles the system. **A unit test scans the source and fails on any `"/dashboard` string literal outside the helper and the tests**, because a link that drops the system does not break — it silently lands on 5e through rule 3. The same pass moves `nav-links.tsx` and `sidenav.tsx` from `next/link` to next-intl's `Link`.
6. **The switch** replaces the segment and keeps the rest of the path when the page is shared, e.g. `/dashboard/dnd5e/geography?place=12` → `/dashboard/daggerheart/geography?place=12`. From a catalogue page it goes to the target system's overview, since the catalogue does not exist there.
7. **Catalogues: one table per system and domain.** New models carry the system slug as a prefix (`daggerheartDomainCard`, `daggerheartAdversary`), and so does every key derived from the domain: config directory, data directory, UI directory, `pagesConfig` key, message namespace. The 5e tables keep their current names. Renaming `spells` to `dnd5eSpell` would be a TD-19-sized migration with no behaviour to show for it, so the unprefixed names mean 5e and stay that way.
8. **Shared entities have no per-system fields.** NPCs, deities, places and factions are identical under every system. The first time a system needs a genuinely mechanical field on one of them, that is a new ADR — this one does not pre-build the extension.
9. **Campaigns.** `campaign.system` is a `String` validated against `GAME_SYSTEMS`, following `adventure.status` and `scene.kind` (SPEC-013). It is backfilled to `dnd5e`. The campaign list filters on the route's system. A campaign opened under another system redirects to its own.
10. **Search** (SPEC-011) searches the world plus the catalogues of the route's system, filtered by the pages' `system`.
11. **Route handlers are unchanged.** `app/api/**` sits outside `[locale]`, and its handlers address a table, and the table already implies the system.

## Alternatives considered

### The system as the first segment — `/[locale]/[system]/dashboard/…`

This reads more like "the system beside the locale", and `dashboard/layout.tsx` would receive the param directly. It was rejected because the locale prefix is "as-needed". Italian URLs have no locale segment, so the first segment would sometimes be a locale (`/en/dnd5e/…`) and sometimes a system (`/dnd5e/…`). Both next-intl's middleware and `proxy.ts`'s locale split would have to learn to tell them apart. It also puts a dynamic segment beside `login` and the root page, which have no system. Inside the dashboard the segment has exactly one position, and only authenticated pages carry it.

### A query parameter — `?system=daggerheart`

This needs no route move. It was rejected because it survives nothing by default. Every link, redirect and form action has to append it, every server component has to read `searchParams`, and there is no layout-level point to validate it. It carries all of the segment's costs and none of its structure.

### A cookie as fallback for URLs without a system

This mirrors how next-intl remembers the locale: the URL wins, and a cookie fills the gap. A link that slipped through would then land on the current system instead of on 5e. It was rejected because that is exactly what hides the bug. Behaviour would depend on invisible state, and a missing system in a link would never be noticed. The deterministic redirect plus the source-scan test makes the miss visible and then prevents it. The DM's decision was also that the URL is where the system lives.

### The system taken from the current campaign, or from a user preference

Both were rejected by the DM in SPEC-018. The setting is viewed through a system, not a campaign, and a preference would not travel with links or allow two tabs on two systems.

### Rewriting existing links in place, with no helper

Changing every `"/dashboard/…"` to a template string with the system is possible. But the next hand-written link would reintroduce the bug with nothing to catch it. One helper plus one test is the smallest thing that stays correct.

### One catalogue table with a `system` column, or systems as a database table

Both are in SPEC-018 §6. A shared table would be mostly nulls with a validator per system. A system the DM could create in the database would have no code, pages or metadata behind it.

### Prefixing the 5e tables too (`dnd5eSpell`)

This is symmetric and tidy. It was rejected for now: it is a rename of the three tables holding the DM's real data, through the string-keyed metadata layer that already produced TD-19's near-misses, and it buys nothing a reader cannot learn from this ADR. It is revisitable (see below).

## Consequences

**Positive**

- A URL fully states what is on screen — locale, system, page — so bookmarks, shared links and two tabs on two systems all behave.
- The auth gate and the login page are untouched: the segment exists only where a session exists.
- Old URLs keep working through one redirect, which is also what keeps the existing e2e suite runnable while T2 lands.
- Adding a system is additive: a vocabulary value, its prefixed domains, its pages. No shared table changes.

**Negative**

- Every dashboard route directory moves one level down, and every dashboard link changes. It is a wide, shallow change that the compiler does not check, which is why the source-scan test exists.
- One redirect hop for legacy URLs, and a silent landing on 5e for any link the test does not see — e.g. a path assembled from pieces at runtime.
- Two naming schemes: unprefixed 5e domains, prefixed domains for every other system.
- `proxy.ts` gains a third concern after locale and auth, in a file whose ordering is already delicate (its comments explain why the locale redirect must resolve before the auth gate).

**Neutral / follow-up work**

- T2 (SPEC-018) implements rules 1–6 and 10 with `dnd5e` alone; T3 implements rule 9; the first Daggerheart slice adds `daggerheart` to the vocabulary.
- The route move is mechanical once rule 5's helper and test exist. It suits a cheaper model; the helper, the proxy step and the test do not.
- `CLAUDE.md`'s "Where things live" changes from `app/[locale]/dashboard/**` to `app/[locale]/dashboard/[system]/**` when T2 lands.

## Revisit when

- A system needs a mechanical field on a shared entity (rule 8), or the same catalogue entry must exist in two systems at once — the "table is the system" rule stops holding.
- Daggerheart becomes the DM's main system, and a legacy URL landing on 5e becomes the wrong default. Changing `DEFAULT_GAME_SYSTEM` is one line; this ADR only needs a note.
- The locale prefix stops being "as-needed", which removes the main objection to putting the system first.
- The 5e tables are migrated for another reason, which is the cheap moment to add their prefix.

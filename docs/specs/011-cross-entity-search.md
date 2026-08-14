# SPEC-011: Cross-entity search

- **Status:** Draft
- **Date:** 2026-08-13
- **Phase:** 3
- **Related:** [ADR-0006](../adr/0006-bilingual-ui.md) (content is never translated; UI copy ships bilingual), [ADR-0007](../adr/0007-message-key-resolution-boundary.md) (message key resolution boundary), `getQuery.ts` (the per-domain free-text mechanism this spec reuses rather than replaces), [SPEC-006](./006-factions.md) (established the `?query=<name>` entity-link convention this spec also uses, in the absence of per-entity detail routes)

---

## 1. Problem

Preparing a session means the DM often knows roughly what they are looking for — a name, half-remembered — but not which of the four catalogues it lives in. Today that means opening the spell list, searching, finding nothing, opening the item list, searching again, and so on, up to four times for one lookup. Each of the four list pages already has its own search box (`app/ui/search.tsx`), but each one only ever queries its own table. There is no way to ask "where is Fireball" once and have the app check everywhere.

## 2. Goal

One search box finds a matching spell, magic item, NPC or deity by name, from a single place, without knowing in advance which catalogue holds it.

## 3. Non-goals

- **Factions and places.** The roadmap item this spec closes names "spells, items, NPCs and deities" specifically, written 2026-08-10 before SPEC-006 shipped factions later that same day. Both are real domains today, but neither is a lookup-by-name problem in the same way: a faction is found from the NPC that belongs to it far more often than by its own name, and a place is found by descending the world tree (SPEC-004), not by searching a flat list — there is no `fetchFilteredPlaces` this spec could reuse the way it reuses the other four. Left as an **open question** for the DM in §9 rather than silently expanded or silently dropped.
- **Searching fields other than `name`.** `getQuery.ts` already only searches `name` for every domain (the free-text branch is not field-configurable per domain); this spec keeps that behaviour rather than introducing a new one. Searching `description` or other free-text fields is a bigger, separate feature (likely full-text search), not a generalization of what exists.
- **Fuzzy or typo-tolerant matching.** The four existing per-domain searches are a plain case-insensitive `contains`, and this spec matches that exactly. Typo tolerance is a real, larger feature (trigram search, a fuzzy-match library) that would need its own spec and its own performance evaluation.
- **Relevance ranking.** Results are grouped by domain and sorted alphabetically within each group, exactly like every existing list page. No scoring, no "best match first."
- **A keyboard shortcut to focus the box** (e.g. Cmd+K). Worth having, but it is a UX addition orthogonal to the search itself; note it in the outcome as a natural follow-up rather than build it speculatively here.
- **Replacing the four per-domain search boxes.** Each list page keeps its own `Search` component unchanged. This spec adds a fifth, cross-domain entry point; it does not touch `app/ui/search.tsx` or any list page's existing filtering.
- **Pagination of cross-entity results.** Each domain group is capped (§5) rather than paginated. A DM who needs the full list for one domain already has that domain's own page, one click away (§5's "see all").

## 4. User stories

- As a DM, I want to type a name once and see whether it's a spell, an item, an NPC or a deity, so I don't have to guess which list to open first.
- As a DM, I want zero results to say so plainly, so I know the name genuinely isn't in my world yet rather than wondering if I mistyped the wrong page's search box.
- As a DM, I want to click a result and land on the right catalogue, so cross-entity search is a shortcut into the existing pages, not a fifth place records live.

## 5. Behaviour

**Entry point**

A new nav item, "Search" (magnifying-glass icon), sits at the top of the sidenav above "Home" — the first thing a DM reaches for, not filed under one domain. It links to `/dashboard/search`. The search input itself lives on that page, not embedded in every page's header; a global always-visible input was considered and rejected for now (§9 has the reasoning) in favour of the same one-page-per-concern shape the rest of the app already uses.

**Main flow**

1. The DM opens `/dashboard/search` and types into the box (the same debounced pattern as `app/ui/search.tsx`: 300ms, writes to `?query=` on the current page).
2. The page issues one read across all four domains — `fetchFilteredSpells`, `fetchFilteredMagicItems`, `fetchFilteredNpc`, `fetchFilteredDeities` — each called with `{ query: <term> }` and nothing else, reusing the exact `getQuery.ts` mechanism every list page already runs. No new query-construction code.
3. Results render as up to four groups, in a fixed order (Spells, Magic Items, NPCs, Deities), each headed by its translated domain name and a count. A group with zero matches is omitted entirely, not shown empty.
4. Each group shows up to 5 names (§9 — this number is a placeholder for agreement, not a considered constant). If a domain has more than 5 matches, the group ends with a "see all N results in _Spells_" link to `/dashboard/spells?query=<term>` — the existing, already-paginated list page.
5. Clicking a result name navigates to that domain's list page filtered to `?query=<exact name>`, the same convention SPEC-006 established for faction/NPC cross-links in the absence of per-entity detail routes. It is not a new detail page.

**Edge cases**

| Situation                                                                     | Expected behaviour                                                                                                                                                                                                                                                                                                                     |
| ----------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty query (page just opened)                                                | No search issued, no groups rendered; a neutral prompt state, not "0 results".                                                                                                                                                                                                                                                         |
| No matches in any domain                                                      | A single "no matches for '<term>'" message, not four empty groups.                                                                                                                                                                                                                                                                     |
| Matches in only one domain                                                    | Only that group renders; the other three are simply absent.                                                                                                                                                                                                                                                                            |
| A name matches in more than one domain (e.g. an NPC and a deity share a name) | Both groups show it — correct, not a duplicate to collapse. Nothing here assumes global uniqueness of names.                                                                                                                                                                                                                           |
| Query below any minimum length                                                | None enforced. `getQuery.ts` already handles an empty string as "no filter" (`isValidString`); a one-character query runs the same `contains` every list page already allows.                                                                                                                                                          |
| Very large result set within one domain                                       | Capped at the per-group limit (§5.4) with a "see all" link; never renders an unbounded list on this page.                                                                                                                                                                                                                              |
| Unauthenticated request                                                       | `/dashboard/search` sits under the same route-level auth gate as every other `/dashboard/**` page — no new mutation, so non-negotiable rule #1 (which is about mutations) does not add a new obligation here, but the page must not be reachable outside the existing dashboard auth boundary. Verified as part of T2/T3, not assumed. |

## 6. Data model changes

**None.** All four domains already have an indexed, searchable `name` column reached through `getQuery.ts`'s existing free-text branch. This spec is entirely a read path over data that already exists.

## 7. Metadata changes

**None.** No new `PageMeta` field, no new `PageType`, no `pagesConfig`/`queryFields` entry. This is not a fifth domain — it is a page that calls the four existing `fetchFiltered*` functions directly, unmodified, the same way any other read does. The metadata layer is not bypassed because it is not touched: each of the four calls goes through the exact `PageMeta` → `getQuery` path its own list page already uses.

One new data-layer file is added, in keeping with "one function per file" (`CLAUDE.md`): `app/lib/data/search/searchAllDomains.ts`, which runs the four `fetchFiltered*` calls via `Promise.all` and slices each result to the per-group cap. It calls the existing functions; it does not reimplement `getQuery` or add a new where-clause shape.

## 8. Acceptance criteria

- [ ] Searching a name that exists in exactly one domain shows one group with that result.
- [ ] Searching a name that exists in two domains shows both groups, both including it.
- [ ] Searching a name that matches nothing shows a single "no matches" message, not four empty groups.
- [ ] A domain with more results than the per-group cap shows the cap and a "see all" link to that domain's own list page, pre-filtered to the same term.
- [ ] Clicking a result navigates to that domain's list page with `?query=<name>` applied.
- [ ] The nav entry point is present on every `/dashboard/**` page and reachable without leaving the existing auth boundary.
- [ ] All new UI copy (nav label, group headings, "no matches", "see all N results in X") exists in both `messages/it.json` and `messages/en.json`, resolved through `next-intl` — none hardcoded in JSX, per `CLAUDE.md`'s bilingual rule and [ADR-0006](../adr/0006-bilingual-ui.md).
- [ ] Coverage has not dropped.

## 9. Implementation plan

**Files touched, in order**

| #   | File                                                                                  | Change                                                                                                                                 |
| --- | ------------------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| 1   | `app/lib/data/search/searchAllDomains.ts` (new)                                       | Runs the four `fetchFiltered*` reads in parallel, slices each to the per-group cap                                                     |
| 2   | `app/[locale]/dashboard/search/page.tsx` (new)                                        | Server Component: reads `?query=`, calls `searchAllDomains`, renders grouped results or the empty/prompt states                        |
| 3   | `app/ui/search/CrossEntitySearchResults.tsx` (new, or similar — exact name TBD at T2) | Presentational grouping/rendering, kept separate from the page so it is testable without a Server Component wrapper                    |
| 4   | `app/ui/dashboard/nav-links.tsx`                                                      | Add the "Search" entry, first in `links`                                                                                               |
| 5   | `messages/it.json`, `messages/en.json`                                                | New keys: nav label, per-domain group headings (may already exist as `common.nav.*` — reuse, don't duplicate), "no matches", "see all" |

**Risks**

- **Reusing `fetchFiltered*` unmodified means each call runs with the full default `itemsPerPage`** (`DEFAULT_ITEMS_PER_PAGE`, not the 5-result cap) and the cap is applied by slicing the returned array afterwards, not by limiting the query itself. At this DM's current data volumes (119 NPCs, dozens of spells/items/deities) this is a non-issue — four small queries, not four expensive ones — but it is a real inefficiency if any domain grows by an order of magnitude. Not worth solving now per `ROADMAP.md`'s "measure first" performance stance; noted here so it isn't rediscovered as a surprise.
- **The per-group cap (5, §5.4) is a placeholder.** It needs to be agreed, not assumed — see open questions.
- **Component naming for T2's presentational piece** is not fixed; whoever implements T2 should follow the nearest existing convention (`EntityList`/`EntityLibrary` naming) rather than the placeholder name above.

**Open questions**

1. **Are factions and/or places in scope for a later expansion of this spec, or a separate one?** §3 excludes both from this pass. If the DM wants them, faction is the easier addition (`fetchFilteredFactions` already exists, same shape as the other four); places would need new data-layer work since nothing today does a flat name search over the world tree.
2. **Is 5 the right per-group cap?** Chosen to keep the page short and force the DM toward the "see all" link for anything bigger, but it's an arbitrary starting number.
3. **Should the nav entry point double as a quick-search popover (type without navigating first), rather than a page you navigate to before typing?** The simpler page-based version is proposed here as the smaller first cut; a popover is a legitimate follow-up if a full page-load-then-type round trip feels slow in practice.

## 10. Task breakdown

- [ ] **T1** — `searchAllDomains`: parallel reads across the four domains, capped per group _(test: a term matching two domains returns both groups; a term matching one domain over the cap returns exactly the cap plus a total count; a term matching nothing returns all-empty; an empty query returns all-empty without issuing any query)_
- [ ] **T2** — `/dashboard/search` page and results rendering: grouped output, zero-groups "no matches" state, empty-query prompt state, "see all" links, result links to `?query=<name>` on each domain's page _(test: renders one/two/zero groups correctly; "see all" link only appears over the cap and points at the right domain and term; every string resolves from the message catalogues, none hardcoded)_
- [ ] **T3** — Nav entry point: new sidenav item, bilingual label, reachable from every dashboard page within the existing auth boundary _(test: the nav item renders on an arbitrary dashboard page and its link resolves to `/dashboard/search`; an unauthenticated request to `/dashboard/search` is redirected the same way any other `/dashboard/**` page is)_

## 11. Outcome

_Fill in at close._

- Shipped: YYYY-MM-DD
- Deviations from spec and why: …
- Follow-up debt created: …

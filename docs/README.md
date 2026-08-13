# Documentation

| Document                                         | What it is                                                      | Read it when                            |
| ------------------------------------------------ | --------------------------------------------------------------- | --------------------------------------- |
| [`PROJECT_STATE.md`](./PROJECT_STATE.md)         | Inventory: stack, layout, data model, current health, dead code | Starting a session; onboarding          |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md)           | How the pieces fit; the metadata layer explained; gaps marked   | Touching metadata, data access or auth  |
| [`TECH_DEBT.md`](./TECH_DEBT.md)                 | Summary table + the write-ups of items still open               | Deciding what to work on                |
| [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md) | Full write-up of every closed item, plus retired doc sections   | Checking if something was already tried |
| [`TESTING.md`](./TESTING.md)                     | Test strategy, coverage targets, techniques, E2E setup          | Writing any test                        |
| [`ROADMAP.md`](./ROADMAP.md)                     | Five phases; feature backlog; explicit non-goals                | Planning; logging an idea               |
| [`adr/`](./adr/)                                 | Architecture decision records — the _why_ behind the code       | Making or revisiting a decision         |
| [`specs/`](./specs/)                             | Feature specs, written before implementation                    | Building a feature                      |
| [`../CLAUDE.md`](../CLAUDE.md)                   | Conventions and rules for AI-assisted development               | Every AI session                        |

## How these fit together

```
ROADMAP.md          what to build, in what order
    │
    ├─► TECH_DEBT.md      hardening work (phases 1–2), with sequencing
    │
    └─► specs/NNN-*.md    feature work (phases 3+), spec before code
              │
              ▼
        ADR if the decision is architecturally significant
              │
              ▼
        implementation, per CLAUDE.md and TESTING.md
              │
              ▼
        PROJECT_STATE.md and ARCHITECTURE.md updated if reality changed
```

`ARCHITECTURE.md` and `PROJECT_STATE.md` describe **what is** and are edited freely. ADRs record **why**, and are immutable once accepted — superseded, never rewritten.

## Keeping them honest

Documentation that drifts is worse than none, because it is believed. Concretely:

- `PROJECT_STATE.md` §6 (health table) is stale the moment CI turns green — update it as items land.
- Tick items off `TECH_DEBT.md` as they ship, **in the summary table _and_ the execution order at the bottom**, and move the item's full write-up into `TECH_DEBT_ARCHIVE.md` (2026-08-01 split — see that file's header). Keeping the write-up is deliberate and good — the archive is the only record of what was tried and rejected — but the _live_ register should only carry what's still open, so it stays short enough to actually be read before starting work.
- If an implementation deviates from its spec, amend the spec's Outcome section. Do not leave the spec describing something that was not built.
- **A completion note is a claim, not a fact.** State how a thing was verified, and prefer a claim the reader can re-run to a number typed once and never rechecked. **State the command's prerequisites too** — this rule used to illustrate itself with "(`pnpm test:e2e --list` says 40)", and by 2026-08-13 that had rotted twice over: the count was stale _and_ the command no longer runs on a fresh checkout, because TD-65 made `playwright.config.ts` refuse to load without a gitignored `.env.test`. A command the reader cannot run is no better than a number they cannot check.

> **These rules were audited against reality on 2026-07-30, and had been broken.**
> Every doc above had drifted: `PROJECT_STATE.md` claimed 117 tests and 89 lint
> warnings against an actual 173 and 0, and simultaneously said the build passed
> and that a removed webpack plugin made it "fail outright"; `README.md` counted
> 31 E2E specs sixty lines before calling the E2E suite unwritten; the register's
> execution order marked 9 items done when 21 were. The single worst case was
> `PROJECT_STATE.md` §1 still instructing readers that Italian identifiers were
> deliberate and "not an inconsistency to fix" — a sentence ADR-0005 had
> explicitly superseded eight days earlier.
>
> The lesson is narrow and worth keeping: **counts and statuses rot; prose about
> _why_ does not.** The reasoning in these documents held up under audit almost
> everywhere. What failed was every number and every checkbox. Prefer writing the
> reasoning, and derive the numbers from a command when you need them.

> **Audited again on 2026-08-08. The same class of drift had fully recurred, and
> the lesson above had been written down but not acted on** — the docs kept
> recording counts.
>
> - `TESTING.md` contradicted itself by a factor of three: "807 tests across 116
>   files" in §1, "267 unit tests across 35 files" thirty lines later. Both wrong.
> - `PROJECT_STATE.md` claimed 5 Prisma models against 7, 5 migrations against 9,
>   `app/dashboard/**` against `app/[locale]/dashboard/**`, "no relations between
>   models" after two had shipped, and pinned a Next.js patch version one behind.
>   It also still carried a line about a live agent worktree from a session long
>   over.
> - `ROADMAP.md`'s Phase 2 table left six rows unticked whose items were closed,
>   while the exit-criteria line four lines above said the phase was complete.
> - **The worst one: `TECH_DEBT.md` had an open item, TD-63, with a full write-up
>   but no row in the summary table — and a header that read "Open items: none".**
>   A session picking work off the register would have concluded there was nothing
>   to do.
>
> **What changed this time, beyond fixing the values.** Volatile counts were
> removed from the prose rather than corrected, and replaced with the command that
> produces them — because correcting a number resets the clock on exactly the same
> failure. If you find yourself typing a test count, a coverage percentage or a PR
> number into a document, write the command instead.

> **Audited a third time on 2026-08-13, and the shape of the drift had changed.**
> The counts held up this time — `TESTING.md` and `PROJECT_STATE.md` §6 had genuinely
> stopped recording them, and the 2026-08-08 lesson worked. What rotted instead was
> **status**: documents describing work as upcoming that had already shipped.
>
> - `ARCHITECTURE.md` said `npc.location`/`deities.location`/`deities.residence`
>   "still exist as columns today (removing them is SPEC-004's T5)" — five days
>   after T5b dropped them, and in direct contradiction of `ROADMAP.md`, which
>   recorded that drop as closing the spec.
> - `PROJECT_STATE.md` called `faction` "a table nothing reads" three days after
>   SPEC-006 shipped it as a fifth domain, counted seven Prisma models against
>   eight, and still described `poi` as the world tree — which it stopped being
>   when SPEC-008 T8 split it into `zone` and `poi`.
> - `specs/README.md`'s index called SPEC-006 "Agreed — next" when it was shipped,
>   and SPEC-007 "Agreed" when its own §11 said "Shipped 2026-08-10" — the header
>   and the outcome section of the same file disagreeing.
> - SPEC-009's T1 checkbox was unticked with the work merged in two commits.
> - **The one that would have cost real time:** SPEC-010 §3 justified its central
>   rule by citing a SPEC-007 capability (removing a place's map image) that was
>   never specified and never built. An agent implementing SPEC-010 would have
>   built on it.
>
> **The lesson this time is narrower than "counts rot".** A number is obviously
> volatile and this project now treats it as such. A _status_ reads as settled
> prose — "removing them is SPEC-004's T5" is a sentence, not a figure — which is
> exactly why nobody re-checks it. **When a spec ships, grep the docs for its
> number and for the thing it changed**, not just the spec file's own checkboxes.
> And a cross-reference between documents is a claim like any other: SPEC-010's
> citation of SPEC-007 was wrong from the day it was written and nothing caught it,
> because no one followed the link.

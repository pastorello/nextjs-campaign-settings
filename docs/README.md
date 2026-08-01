# Documentation

| Document                                 | What it is                                                      | Read it when                           |
| ---------------------------------------- | --------------------------------------------------------------- | -------------------------------------- |
| [`PROJECT_STATE.md`](./PROJECT_STATE.md) | Inventory: stack, layout, data model, current health, dead code | Starting a session; onboarding         |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md)   | How the pieces fit; the metadata layer explained; gaps marked   | Touching metadata, data access or auth |
| [`TECH_DEBT.md`](./TECH_DEBT.md)         | Summary table + open items (TD-37–TD-43), with execution order  | Deciding what to work on               |
| [`TECH_DEBT_ARCHIVE.md`](./TECH_DEBT_ARCHIVE.md) | Full write-up of every closed item, TD-01–TD-36          | Checking if something was already tried |
| [`TESTING.md`](./TESTING.md)             | Test strategy, coverage targets, Jest → Vitest migration        | Writing any test                       |
| [`ROADMAP.md`](./ROADMAP.md)             | Five phases; feature backlog; explicit non-goals                | Planning; logging an idea              |
| [`adr/`](./adr/)                         | Architecture decision records — the _why_ behind the code       | Making or revisiting a decision        |
| [`specs/`](./specs/)                     | Feature specs, written before implementation                    | Building a feature                     |
| [`../CLAUDE.md`](../CLAUDE.md)           | Conventions and rules for AI-assisted development               | Every AI session                       |

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
- **A completion note is a claim, not a fact.** State how a thing was verified, and prefer a claim the reader can re-run (`pnpm test:e2e --list` says 40) to a number typed once and never rechecked.

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

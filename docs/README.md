# Documentation

| Document                                 | What it is                                                      | Read it when                           |
| ---------------------------------------- | --------------------------------------------------------------- | -------------------------------------- |
| [`PROJECT_STATE.md`](./PROJECT_STATE.md) | Inventory: stack, layout, data model, current health, dead code | Starting a session; onboarding         |
| [`ARCHITECTURE.md`](./ARCHITECTURE.md)   | How the pieces fit; the metadata layer explained; gaps marked   | Touching metadata, data access or auth |
| [`TECH_DEBT.md`](./TECH_DEBT.md)         | 18 prioritised debt items with fixes and execution order        | Deciding what to work on               |
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

- `PROJECT_STATE.md` §6 (health table) is stale the moment CI turns green — update it as Phase 1 items land.
- Tick items off `TECH_DEBT.md` as they ship; do not leave completed work in the register.
- If an implementation deviates from its spec, amend the spec's Outcome section. Do not leave the spec describing something that was not built.

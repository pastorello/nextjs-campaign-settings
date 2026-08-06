# Feature Specs

One spec per feature, written **before** implementation. The spec is the artefact you and the AI agent agree on; the code is what follows from it.

## Why bother, on a solo project

Because the failure mode of AI-assisted development is not bad code — it is confidently-built _wrong_ code. An agent given "add tagging to spells" will produce something plausible and complete in twenty minutes, and you will discover it modelled tags as a comma-separated string in an existing column only once you try to filter by them. A spec forces the twenty seconds of thought that prevents that, and it moves the expensive conversation from code review to before any code exists.

It also produces, as a by-product, a written record of product reasoning — which is exactly what a portfolio reviewer cannot otherwise see.

## Workflow

```
1. SPEC   docs/specs/NNN-feature-name.md      what & why. No implementation detail.
              ↓  agree before proceeding
2. PLAN   the "Implementation plan" section    how. Files, order, risks.
              ↓  agree before proceeding
3. TASKS  the "Task breakdown" section         one commit each, independently verifiable.
              ↓
4. BUILD  one task at a time, tests included
              ↓
5. CLOSE  tick acceptance criteria, mark Status: Shipped, note deviations
```

Steps 1–3 are cheap and go in one file. Do not skip straight to 4 for anything larger than a bug fix — that is precisely where spec-driven development earns its keep.

## Rules

- **The spec describes behaviour, not implementation.** "The user can filter spells by one or more tags" — not "add a `tags` column".
- **Acceptance criteria are testable.** If you cannot write a Playwright assertion for it, rewrite it.
- **Non-goals are as important as goals.** They are what stops an agent gold-plating.
- **Amend the spec when reality diverges.** A spec that no longer matches what was built is worse than none. Record the deviation and why.
- **One spec per feature.** If it needs three, it is three features.

## Naming

`NNN-kebab-case-name.md`, numbered sequentially: `001-spell-tagging.md`.

## Index

| #   | Feature                                             | Status                       | Phase |
| --- | --------------------------------------------------- | ---------------------------- | ----- |
| 001 | [Combat tracker](./001-combat-tracker.md)           | Draft — skeleton, not agreed | 4     |
| 002 | [Map POI persistence](./002-map-poi-persistence.md) | Shipped 2026-08-01           | 3     |
| 003 | [Real relations](./003-real-relations.md)           | Superseded by 004            | 3     |
| 004 | [World model](./004-world-model.md)                 | Agreed — MVP scoped, §5.1    | 3     |

Feature ideas live in [`../ROADMAP.md`](../ROADMAP.md) until they are ready for a spec.

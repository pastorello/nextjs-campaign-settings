# SPEC-NNN: <feature name>

- **Status:** Draft | Agreed | In progress | Shipped | Abandoned
- **Date:** YYYY-MM-DD
- **Phase:** <ROADMAP phase>
- **Related:** <ADRs, debt IDs, other specs>

---

## 1. Problem

What can the user not do today, or what is painful? Written from the user's perspective — a Dungeon Master preparing or running a session. No solution language here.

> Example: _Preparing a session means finding every NPC connected to a location. Today the only way is scrolling the NPC list and reading each entry, because there is no way to group or cross-reference them._

## 2. Goal

One sentence. What is true after this ships that is not true now.

## 3. Non-goals

Explicitly out of scope. This section is what prevents scope creep, both yours and an agent's. Be specific.

- …
- …

## 4. User stories

- As a DM, I want to … so that …
- As a DM, I want to … so that …

## 5. Behaviour

What the user sees and does. Cover the ordinary path first, then the edges.

**Main flow**

1. …
2. …

**Edge cases**

| Situation             | Expected behaviour |
| --------------------- | ------------------ |
| Empty state           | …                  |
| Validation failure    | …                  |
| Concurrent edit       | …                  |
| Very large result set | …                  |

## 6. Data model changes

Prisma schema changes, if any. State the migration strategy for existing rows — this is the part most often skipped and most expensive to get wrong.

```prisma
// proposed
```

- Backfill needed? …
- Reversible? …

## 7. Metadata changes

Which `PageMeta` entries are added or changed, and in which config file. Remember every field needs `fieldType`, `controlType`, `validator`, `getDatum` — see [ADR-0003](../adr/0003-metadata-driven-domain-configuration.md).

## 8. Acceptance criteria

Testable, checkable statements. These become the test cases.

- [ ] …
- [ ] …
- [ ] Every new mutation rejects an unauthenticated request
- [ ] Every new mutation rejects invalid input with field-level errors
- [ ] Coverage has not dropped

## 9. Implementation plan

_Fill in after the sections above are agreed._

**Files touched, in order**

| #   | File | Change |
| --- | ---- | ------ |
| 1   | …    | …      |

**Risks**

- …

**Open questions**

- …

## 10. Task breakdown

Each task is one commit, independently verifiable, small enough to review in one sitting.

- [ ] **T1** — … _(test: …)_
- [ ] **T2** — … _(test: …)_
- [ ] **T3** — … _(test: …)_

## 11. Outcome

_Fill in at close._

- Shipped: YYYY-MM-DD
- Deviations from spec and why: …
- Follow-up debt created: …

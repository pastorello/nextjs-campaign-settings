# Architecture Decision Records

An ADR captures **one architecturally significant decision**: what was decided, why, what was rejected, and what it costs. Code shows the outcome; the ADR preserves the reasoning, which is the part you lose otherwise.

## When to write one

Write an ADR when a decision:

- is hard or expensive to reverse (data model, auth model, framework, ORM)
- introduces a pattern others must follow
- rejects an obvious alternative for a non-obvious reason
- you will have forgotten the reasoning for in three months

Do **not** write one for routine implementation choices, naming, or anything a code comment covers.

## How

1. Copy `TEMPLATE.md` to `NNNN-short-title.md` with the next number.
2. Status starts as `Proposed`; move to `Accepted` once agreed.
3. Never edit an accepted ADR's decision. Supersede it: write a new ADR and mark the old one `Superseded by ADR-NNNN`.
4. Link it from the code or doc it affects.

## Index

| #                                                      | Title                                           | Status   | Date       |
| ------------------------------------------------------ | ----------------------------------------------- | -------- | ---------- |
| [0001](./0001-record-architecture-decisions.md)        | Record architecture decisions                   | Accepted | 2026-07-22 |
| [0002](./0002-testing-stack.md)                        | Use Vitest and Playwright for testing           | Accepted | 2026-07-22 |
| [0003](./0003-metadata-driven-domain-configuration.md) | Metadata-driven domain configuration            | Accepted | 2026-07-22 |
| [0004](./0004-server-actions-over-rest-api.md)         | Server Actions over a REST API layer            | Accepted | 2026-07-22 |
| [0005](./0005-english-identifiers.md)                  | English identifiers in code, Italian in the UI  | Accepted | 2026-07-22 |
| [0006](./0006-bilingual-ui.md)                         | Bilingual UI (it + en), single-language content | Accepted | 2026-07-22 |
| [0007](./0007-message-key-resolution-boundary.md)      | Resolve message keys at the render boundary     | Accepted | 2026-07-30 |
| [0008](./0008-map-image-storage.md)                    | Map images on a local volume, served with auth  | Proposed | 2026-08-06 |

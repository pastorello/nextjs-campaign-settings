# ADR-0001: Record architecture decisions

- **Status:** Accepted
- **Date:** 2026-07-22
- **Deciders:** Turu

## Context

The project has two commits and no written rationale for any of its design choices. Several non-obvious decisions are already embedded in the code — the metadata-driven configuration layer, Server Actions instead of a REST API, Prisma with a driver adapter, Italian domain vocabulary — and none of them is explained anywhere. A reader (including the author in six months, or an AI agent starting a fresh session) can see _what_ was built but not _why_.

This matters more than usual for two reasons. First, the project is intended as a portfolio piece: demonstrating deliberate architectural reasoning is a large part of what a reviewer is looking for, and it is invisible unless written down. Second, the development flow is AI-assisted, and an agent with no access to the reasoning will happily "simplify" a deliberate abstraction into something worse.

## Decision

We will record architecturally significant decisions as Architecture Decision Records in `docs/adr/`, following the lightweight format Michael Nygard described. Each ADR is one Markdown file, numbered sequentially, immutable once accepted, and superseded rather than edited.

An ADR is written **before** implementing the decision it describes, not afterwards as documentation.

## Alternatives considered

### No formal record; rely on code comments and commit messages

Zero overhead, and for a solo project the reasoning is in the author's head anyway. Rejected because that last part is exactly the failure mode: it is in the author's head only until it isn't. Comments explain a line; they cannot hold "we chose X over Y because Z" without bloating the code. Commit messages are searchable in theory and unfindable in practice.

### A single ARCHITECTURE.md holding everything

Simpler, one file. Rejected because it conflates two different documents: current-state description (which should be edited freely as the system changes) and decision history (which should be immutable, so that superseded reasoning remains visible). We keep both — `ARCHITECTURE.md` describes what is, `adr/` records why. They serve different readers.

### A wiki or Notion page

Rejected: decisions drift out of sync with code when they live outside the repository, and they are not available to an AI agent working in the repo.

## Consequences

**Positive**

- Rationale survives the author's memory and is available to any agent reading the repo.
- Reviewing a decision means reviewing a document, not archaeology through a diff.
- Demonstrates deliberate engineering practice — a portfolio signal in itself.
- Superseded ADRs preserve the history of _why we changed our mind_, which is often more informative than the current state.

**Negative**

- Overhead per significant decision (~20 minutes).
- Risk of over-application: writing ADRs for trivia devalues the whole set. The `README.md` guidance on when _not_ to write one exists to counter this.

**Neutral**

- The first four ADRs are retroactive, documenting decisions already embedded in the code. This is a one-time catch-up, not the intended pattern.

## Revisit when

Never, realistically. If ADRs stop being written for three consecutive significant decisions, the practice has failed in fact and this ADR should be marked deprecated rather than quietly ignored.

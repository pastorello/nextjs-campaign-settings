# ADR-0018: Store Daggerheart features in one table per owner

- **Status:** Accepted
- **Date:** 2026-09-19
- **Deciders:** the DM (maintainer), with Claude Code
- **Related:** [SPEC-021](../specs/021-daggerheart-domains-and-classes.md) §6 (decides it), [SPEC-018](../specs/018-game-systems.md) §9 open question 1 (asks it), [ADR-0009](./0009-world-tree-as-one-polymorphic-table.md) (the polymorphic shape it weighs), [ADR-0011](./0011-inline-collections-outside-the-metadata-layer.md) (how features are edited), [ADR-0013](./0013-game-systems.md), [ADR-0017](./0017-record-images.md) (the same choice, made for images)

## Context

Daggerheart records carry _features_: a named block of formatted text, in an order the DM sets. SPEC-021 has two owners — a class (its class features) and a subclass (its foundation, specialization and mastery features). SPEC-018 §6 lists more owners in later slices: ancestries (exactly two), communities (one), adversaries and environments (ordered, each with a kind), and the optional feature on a weapon or armour.

SPEC-018 §9 left one question open for this slice: store every feature in one polymorphic table, with an owner type and an owner id, or give each owner its own feature table.

The facts that bear on it:

- **The owners' features are not the same shape.** A subclass feature has a tier and is ordered _within_ that tier; a class feature has neither. Adversary features have a kind (action / reaction / passive), environment features a kind and optional prompt questions, and the ancestry and community counts are fixed.
- **Features are rows edited inline in the parent's page** (ADR-0011): no list page, no header filters, no search. Nothing asks for "every feature of every kind" as one query.
- **Deleting an owner must take its features with it.** A class deleted with its features left behind is a leak nothing in the UI would ever show.
- **The project has made this choice twice.** ADR-0009 chose one polymorphic table for the world tree, because every node _is_ the same kind of thing with one parent edge. ADR-0017 chose a real foreign key per owner for images, because the owners are unrelated tables and a polymorphic `ownerId` cannot be a foreign key.

## Decision

We will store features in **one table per owner**: `dhClassFeature` (`classId`, `onDelete: Cascade`) and `dhSubclassFeature` (`subclassId`, `onDelete: Cascade`, plus `tier`). Each later owner gets its own table, holding only the columns its features have.

Each table has `position`, `name` and `text`, English column names, and no timestamps, like `sceneCreature`. `position` orders the rows within their parent, or, for subclass features, within `(subclassId, tier)`.

## Alternatives considered

### One polymorphic `feature` table (`ownerType` + `ownerId`)

One table and one set of actions for every owner, and adding an owner needs no migration. It is ADR-0009's shape, and it fits ADR-0009's case: a node of the world tree is always a place.

It was rejected for three reasons, the same ones that ruled it out for images in ADR-0017:

- **No foreign key.** `ownerId` cannot reference six tables. Nothing stops a feature pointing at a deleted class or at an id of the wrong type, and deleting an owner cannot cascade. Cleanup becomes application code or a trigger per owner — code the database would otherwise do for free.
- **The columns diverge.** `tier` exists only on subclass features, `kind` only on adversary and environment features, prompt questions only on environment features. One table would carry every column as nullable and need a validator per owner type to say which apply, which is SPEC-018 §6's argument against one catalogue table with a `system` column.
- **What it buys is not needed.** The query it makes easy — "all features" — has no caller. Every read is "this owner's features, in order".

### One polymorphic table with a nullable foreign key per owner (`classId?`, `subclassId?`, …) and a CHECK that exactly one is set

This keeps real foreign keys and cascades in one table. It was rejected because it is the per-owner columns problem again: a new owner is still a migration (a new FK column and a wider CHECK), and the table still carries every owner's own columns as nullables. It keeps the cost of both options and the benefit of neither.

### Features as JSON on the owner

An array of `{ name, text, tier? }` in a `Json` column: no table, no join, reordering is rewriting the array. It was rejected because the rows are edited one at a time inline (ADR-0011): reordering, inserting and deleting would each rewrite the whole array, with no per-row id to address a concurrent edit or a record link to. It also gives the database nothing to check.

## Consequences

**Positive**

- Real foreign keys: a feature cannot outlive or mis-point at its owner, and deleting a class or subclass removes its features in the same statement.
- Each table holds only its owner's columns, so its validator is simple and the schema says what a feature of that owner is.
- The inline editors follow ADR-0011's existing pattern (`scene`, `sceneCreature`, `loot`), one component per owner.

**Negative**

- More tables: two now, and one per feature-bearing owner in SPEC-018 T5–T7.
- Similar code per owner (reorder, insert, delete). Where it is truly identical it should be shared as a helper that takes the per-table queries as callbacks, as `app/lib/data/campaigns/validateAndReorder.ts` already does for SPEC-013's four reorder actions — not by merging the tables.

**Neutral / follow-up work**

- SPEC-021 T4 and T5 build the two inline editors. The scalar fields (`name`, `text`, `tier`) still declare their `PageMeta` (ADR-0011).
- **Naming.** The tables use SPEC-021's `dh` prefix rather than the `daggerheart` prefix ADR-0013 rule 7 gave as its example (`daggerheartDomainCard`). The rule — prefix everything a non-5e domain derives, so unprefixed means 5e — is unchanged; SPEC-021 §6 chose the shorter prefix.

## Revisit when

- A caller needs every feature across owners at once, such as full-text search over feature text or an export that walks every feature. A view (`UNION ALL` over the feature tables) is the first thing to try before merging tables.
- Two owners' features become truly identical in shape and behaviour, and stay that way across a slice. Then a shared table for exactly those two is worth weighing — still with real foreign keys, not an `ownerType`.

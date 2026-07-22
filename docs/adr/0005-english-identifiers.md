# ADR-0005: English identifiers in code, Italian in the UI

- **Status:** Accepted
- **Date:** 2026-07-22
- **Deciders:** Turu
- **Related:** [TD-19](../TECH_DEBT.md), [TD-08](../TECH_DEBT.md), [ADR-0003](./0003-metadata-driven-domain-configuration.md)
- **Supersedes:** the language convention previously stated in `CLAUDE.md`, which described the mixed state as deliberate. It was not — it was inferred from the code and recorded as intent in error.
- **Amended by:** [ADR-0006](./0006-bilingual-ui.md). This ADR says user-facing text is Italian; ADR-0006 makes it Italian _and_ English, served from message catalogues. The decision recorded here — English identifiers, Italian never in code — is unaffected.

## Context

The codebase mixes Italian and English identifiers, and the mixture does not follow a rule. It follows the order in which things were written:

- Prisma models are English: `spells`, `magicitems`, `deities`
- but one is Italian abbreviated: `png` (_personaggi non giocanti_)
- columns are Italian: `nome`, `descrizione`, `rarita`, `tempodilancio`, `sintonia`
- functions are English: `fetchFilteredSpells`, `usePageManager`, `validateParams`
- enums are Italian: `Allineamento`, `Fazione`, `Circolo`, `GradoPatrono`
- interfaces are mixed: `DBSpell` alongside `Patrono`

A measured scan finds roughly 1,000 occurrences of Italian domain identifiers across 54 of the 288 TypeScript files.

There is a defensible version of the mixed convention — Italian for domain vocabulary because it mirrors the Italian D&D 5e rulebook, English for technical infrastructure. That convention is coherent and some codebases use it deliberately. But it is not what this codebase does. `spells` and `magicitems` are domain vocabulary and they are English; `nome` and `descrizione` are not domain vocabulary at all, they are generic field names, and they are Italian. The pattern is chronological, not semantic.

Two further considerations weigh on the decision. The project is intended as a portfolio piece, and will be read by people who do not speak Italian; an unexplained language mixture reads as inattention rather than as a choice. And `png` collides with the image format — the repository simultaneously contains a `/dashboard/png` route, a `.*\.png$` pattern in `proxy.ts`'s matcher, and genuine `.png` files in `public/`. No bug results today, because the regex requires a literal dot, but the ambiguity is a standing invitation to one.

## Decision

**All identifiers in English. All user-facing text in Italian.**

Concretely:

- Variables, functions, types, interfaces, enums, enum members, Prisma model and field names: English.
- UI copy, labels, placeholders, error messages shown to a user: Italian. This is the product's language and is not affected.
- `png` becomes `npc`.

**Postgres column names are not renamed.** Prisma's `@map` and `@@map` decouple the TypeScript-facing name from the database column:

```prisma
model spells {
  name        String @map("nome")
  description String @map("descrizione")
  level       Int    @map("livello")
}
```

The code becomes English with no schema migration, no data movement and no risk to existing rows. Renaming the columns themselves stays available as a later, isolated, reversible change — and may simply never be worth doing.

**Sequencing: this work happens after TD-03 and TD-08**, not before. It is tracked as TD-19.

## Alternatives considered

### Keep the mixed convention and document it as intentional

Zero work, and the "Italian domain vocabulary" rationale is genuinely defensible in principle.

Rejected because it is not what the code does. Writing the rule down would mean writing down something false, then asking future readers and AI agents to act on it — which produces exactly the wrong behaviour, as an agent dutifully "restores" Italian names in files that were already English. Documentation that formalises an accident is worse than no documentation, because it is believed.

### Rename everything including Postgres columns, now

The cleanest end state, no `@map` indirection to explain.

Rejected for now on cost and risk rather than principle. It requires a tested migration, a backup, and coordination with the seed data — for a benefit that is invisible from the application. `@map` gets 95% of the value at roughly 10% of the risk. The remaining 5% stays available later.

### Rename only the worst offenders (`png` → `npc` and a handful of ambiguous fields)

Minimal diff, addresses the one identifier that actively causes confusion.

Rejected because it leaves the codebase mixed _and_ adds a third pattern to the existing two. If the mixture is the problem, a partial fix does not solve it; it just moves the boundary somewhere less predictable.

### Do it immediately, before the Phase 1 hardening work

Superficially attractive: all subsequent work would then be written in English from the start, avoiding churn.

Rejected on a specific technical risk. The metadata layer is **string-keyed**. Field names appear as string literals in `pageMetaFields` (`metaField: "descrizione"`) and are used as dynamic index keys in `getQuery` (`whereClause[item] = …`, `pageMetaFields[item].fieldType`). TypeScript cannot verify these. A rename that misses one string does not fail to compile — it produces a filter that silently stops filtering, or a form control that silently stops binding. With no test suite (TD-03) and `any` throughout the query layer (TD-08), nothing would catch it.

After TD-08 makes `PageMeta` a discriminated union with typed keys, the same refactor becomes largely compiler-verified. The ordering is not caution for its own sake; it converts an unverifiable change into a verifiable one.

## Consequences

**Positive**

- One rule, stated once, with no exceptions to remember.
- Readable by an international audience — the portfolio audience.
- `npc` removes a genuine ambiguity with the image format.
- AI agents work more reliably against English identifiers, and no longer need a special-case instruction about which words not to "fix".
- No database migration, no data risk, fully reversible.

**Negative**

- A large mechanical diff (~1,000 sites, 54 files) that will dominate `git blame` for those files. Mitigate by landing it as a single pure-rename commit with no behaviour change, and adding its SHA to `.git-blame-ignore-revs`.
- `@map` adds a layer of indirection: the field is `name` in code and `nome` in the database. Anyone reading raw SQL or using `psql` sees the Italian name. Acceptable, and documented here.
- The Italian D&D terms genuinely have no clean English equivalent in a few places — `circolo` (school of magic) and `grado patrono` are the awkward ones. Where a translation would lose meaning, keep the Italian term as a _label_ in the metadata and use the English concept name as the identifier.

**Neutral / follow-up**

- **TD-19** created: perform the rename. Blocked by TD-03 and TD-08.
- Until TD-19 runs the codebase stays mixed. `CLAUDE.md` records the transitional rule: new code in English, no opportunistic renaming of existing identifiers.
- Seed data in `app/seed/initial-data/` uses the field names and must be renamed in the same commit.

## Revisit when

The `@map` indirection becomes a practical nuisance — for example if direct SQL access or database tooling becomes a regular part of the workflow. At that point rename the columns for real, as a separate, isolated migration.

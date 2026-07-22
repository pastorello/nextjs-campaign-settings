# ADR-0003: Metadata-driven domain configuration

- **Status:** Accepted
- **Date:** 2026-07-22
- **Deciders:** Turu
- **Related:** [TD-02](../TECH_DEBT.md), [TD-08](../TECH_DEBT.md), [TD-09](../TECH_DEBT.md), [ARCHITECTURE.md §2](../ARCHITECTURE.md)

*Retroactive: this documents a decision already embodied in the code, so that it is preserved deliberately rather than by accident.*

## Context

The app manages four structurally similar domains — spells, magic items, NPCs, deities — each with 6 to 17 fields. Every domain needs the same five things per field: a form control, a list column, a filter, a sort key, and a way to render a stored integer as a human-readable Italian label (`livello: 3` → `"3° livello"`, `fazione: 2` → `"Corporazione dei Mercanti"`).

Written naively, that is five places per field where the same knowledge lives. Across roughly 45 fields, adding one field to one domain means touching five files and remembering all five. The failure mode is not dramatic: it is a field that renders in the form, saves correctly, and then silently fails to appear as a filter option because one of the five places was missed.

The domains will also grow. Planned expansions (see `ROADMAP.md`) include encounters, factions and locations as first-class entities — each bringing its own field set.

## Decision

Each field is declared exactly once as a `PageMeta` object, in a per-domain file under `app/lib/config/<domain>/`. That single declaration carries everything the field needs:

```ts
{
  metaField: "livello",
  label: "Livello",
  defaultValue: 0,
  fieldType: FieldType.integer,      // storage shape
  controlType: ControlType.Select,   // how to render it
  options: levels,                   // choices, where applicable
  validator: z.number().int(),       // how to validate it
  getDatum: (d) => getDataLabel(levels, d),  // how to display it
}
```

Declarations compose into a flat registry (`pageMetaFields.ts`) and are ordered per page (`pagesConfig.ts`). Form rendering, list columns, filter controls, sort headers and Prisma `where`/`orderBy` construction all read from that one source.

**Adding a field means editing one file.** This is the invariant the architecture exists to protect, and no component may bypass it by hardcoding field knowledge.

## Alternatives considered

### Explicit, hand-written components per domain

A `SpellForm` that lists its inputs literally, a `SpellList` that names its columns. Far more readable in isolation — anyone can open the file and see exactly what renders, with no indirection.

Rejected because of the multiplication: 4 domains × 5 concerns × ~11 fields average. The duplication is not hypothetical — the codebase currently has *both*, and the four `XxxCard`/`XxxList`/`XxxLibrary`/`XxxForm` quartets are roughly 80% identical (TD-09 exists to collapse them into the metadata layer). The experiment has already run and the duplicated version lost.

This alternative is genuinely better for a two-domain app. It stops being better somewhere around four, which is where this project sits and past which it is heading.

### Generate everything from the Prisma schema

Prisma already knows field names and types; a generator could derive forms and lists automatically. Truly one source of truth, and no hand-written metadata at all.

Rejected because the schema knows storage, not presentation. It cannot know that `livello: 3` displays as `"3° livello"`, that `circolo` is a multiselect over an Italian-labelled enum, that `descrizione` renders as rich text while `aspetto` is plain, or that `tirosalvezza` is optional in the UI but has a specific placeholder. The interesting half of each field's definition is presentational and has no home in the database schema. A generator would need an annotation layer — which is what `PageMeta` is, minus the codegen step and its ceremony.

### An off-the-shelf schema-driven form library (React Hook Form + Zod resolvers, Formik, JSON Schema renderers)

Rejected as a partial solution to the wrong scope. These solve form rendering and validation well, but the duplication problem here spans forms *and* list columns *and* filters *and* query construction. Adopting one would leave three of the five concerns unsolved and add a dependency whose abstraction competes with the one we still need to build. The Zod validators in `PageMeta` deliberately keep the door open to using such a library *underneath* this layer later.

### Runtime configuration in the database

Fields defined in a `field_definitions` table, editable without deploying. Maximum flexibility — a DM could add custom fields to their campaign.

Rejected as premature and type-hostile: it trades compile-time safety for flexibility nobody has asked for. Worth revisiting only if user-defined custom fields become a real requirement.

## Consequences

**Positive**

- Adding a field is a one-file change. Adding a whole domain is one config file plus data-layer functions.
- Consistency is structural rather than disciplinary: every domain filters, sorts and paginates identically because they share the code path.
- The system is the project's most substantial piece of engineering and its clearest portfolio signal — provided it is well-typed and documented, which it currently is not.
- Testing concentrates usefully: `getQuery` is a pure function from metadata plus params to a Prisma query, so it can be tested exhaustively with no database.

**Negative**

- Indirection. A newcomer tracing "why does this select show these options" follows component → `pagesConfig` → `pageMetaFields` → `<domain>Meta` → options file. Mitigated by documenting the chain explicitly in `ARCHITECTURE.md §2`.
- The abstraction is only as good as its types. Currently `PageMeta` does not correlate `fieldType` with `validator`, `defaultValue` and `getDatum`, so invalid metadata compiles — TD-08 addresses this and is the highest-value follow-up to this ADR.
- Unusual fields fight the abstraction. Escape hatch: render a bespoke component for that field and note why in a comment.

**Neutral / follow-up**

- **TD-02**: the `validator` field is declared on every entry and read by nothing. The abstraction's most valuable property — validation defined alongside the field — is currently unrealised. Wiring it up is the highest-priority follow-up.
- **TD-08**: make `PageMeta` a discriminated union on `fieldType`.
- **TD-09**: collapse the duplicated per-domain components into generic metadata-driven ones. Sequence after TD-08, so the compiler can verify the refactor.

## Revisit when

A fifth or sixth domain proves genuinely structurally different (nested/repeating fields, relations to other entities, per-campaign custom fields), or the escape-hatch count exceeds roughly three fields. At that point the question is whether to extend `PageMeta` or to accept a hybrid where irregular domains opt out.

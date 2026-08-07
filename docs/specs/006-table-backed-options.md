# SPEC-006: Table-backed options in the metadata layer

- **Status:** Draft — not agreed, not started
- **Date:** 2026-08-08
- **Phase:** 3
- **Related:** solves the problem [SPEC-003](./003-real-relations.md) §7 raised and left open, which [SPEC-004](./004-world-model.md) §7/§9 inherited and also left open; consumes SPEC-004 T1's `faction` table; [ADR-0003](../adr/0003-metadata-driven-domain-configuration.md) (the metadata layer), [ADR-0006](../adr/0006-bilingual-ui.md) (content is never translated), [ADR-0007](../adr/0007-message-key-resolution-boundary.md) (where option labels resolve), TD-61 (`optionValueValidator`, whose job the FK takes over here)

---

## 1. Problem

**The DM cannot add a faction to their own world.**

The Circle of Grey Mages, the Temple of the Red Demons, the Kingdom of Kang — twenty-one factions, and every one of them is a literal in `app/lib/config/npc/factions.ts`. Inventing a twenty-second means editing TypeScript, adding two message-catalogue entries, and redeploying. For an app whose stated goal is that "a DM starts with an empty installation and builds their universe from nothing" (SPEC-004 §2), a hardcoded faction list is the same defect the hardcoded place list was — it was just not the half that got fixed.

**The table to fix it already exists and nothing reads it.** SPEC-004 T1 shipped `faction` (`id`, `name`, `npc[]`) and put a real foreign key on `npc.fazione`. The schema comment says so plainly: _"additive, not yet referenced by any code path."_ There is no `app/lib/data/faction/`, and `prisma.faction` appears nowhere in the app. The migration ran, the integrity constraint is live, and the UI still reads the TypeScript array beside it. **That is a second source of truth shipped on purpose**, deferred because the piece that would consume it was not designed.

**Why it was deferred twice.** `PageMeta.options` is a static array imported at module load, and four separate consumers depend on that being synchronous:

| Consumer                                                                              | Where it runs         | What it does with `options`                          |
| ------------------------------------------------------------------------------------- | --------------------- | ---------------------------------------------------- |
| `resolveFieldValue` → `resolveOptions` → `getDataLabel`                               | server **and** client | turns a stored `Int` into a display label            |
| `Select` (`app/ui/forms/inputs/Select/`)                                              | client                | renders the dropdown                                 |
| `SelectButtonery`                                                                     | client                | renders the filter control                           |
| `firstOptionValue(list)` → `defaultValue`, `optionValueValidator(list)` → `validator` | **module scope**      | evaluated once, at import, before any request exists |

The fourth row is the actual obstacle, and it is why "just make it async" does not work: a module-scope constant cannot await a query. SPEC-003 §7 named this exactly — _"Extending `PageMeta` to express 'options come from here' without breaking the synchronous path for the other ~18 fields is the main design work of this item, and it is not yet solved in this draft."_ It is still not solved.

**Getting this wrong is expensive in a specific way.** The obvious escapes each damage the abstraction rather than failing loudly:

- **Make every field's options async.** Twenty of the twenty-two option-backed fields are closed vocabularies that will never live in a table (rarity, spell level, alignment — see SPEC-003 §6 and ADR-0009). They would all pay for a capability none of them needs, and every card and form on the site becomes async.
- **Add a parallel "dynamic field" path.** Then `resolveFieldValue`, `getDataLabel`, `Select` and `SelectButtonery` each need to know which kind they are holding. Two code paths through the metadata layer is precisely the divergence TD-09 spent a day collapsing, and the failure mode is silent: one path gets a fix, the other does not.
- **Read the table once at module load and cache it.** Stale the moment the DM adds a faction, which is the entire point of the feature.

## 2. Goal

A `PageMeta` field can declare that its options are rows in a table, and display, forms, filters and validation all work — without changing the twenty static fields, without a second code path through the metadata layer, and without making `buildEntitySchema` asynchronous.

## 3. Non-goals

- **Converting the other option lists to tables.** Rarity, spell level, casting time, alignment, tarot card and the rest are closed vocabularies; SPEC-003 §6 classified them and ADR-0009 restated the reasoning for `kind`. They stay static arrays, and this spec's whole design premise is that they are unaffected.
- **`location`.** It is the world tree now, and T5b deletes the column outright (SPEC-004). It is not a table-backed option and must not be re-modelled as one.
- **Array-valued table-backed fields.** `spells.circle` and `spells.classes` are multiselects over static lists and stay that way. Table-backed means single-value here; the array variant is additive later if anything ever needs it.
- **A general admin CRUD area.** Creating and renaming factions is in scope only as far as §5's flow needs; a full `pagesConfig`-driven faction page is a separate, later decision, and factions deliberately do **not** become a browsable catalogue with filters (the same call SPEC-002/SPEC-004 §7 made for places).
- **Caching and invalidation beyond what Next.js already does.** Options are read per request. If that ever shows up in a profile it gets its own item; measuring first is the rule (`ROADMAP.md`, "Explicitly not planned" / performance).
- **Deleting `factions.ts` in the same task as introducing the mechanism.** The static list stays until the table demonstrably drives the UI, per SPEC-004's own additive-first sequencing.

## 4. User stories

- As a DM, I want to **add a faction** without editing source, so my world can grow during a campaign instead of between deploys.
- As a DM, I want to **rename a faction** and have every NPC that belongs to it show the new name immediately, without a data migration.
- As a DM, I want the app to **stop me deleting a faction that NPCs still belong to**, rather than silently blanking their faction cell.
- As a DM starting from an **empty installation**, I want to create NPCs before I have invented any factions.

## 5. Behaviour

**Main flow**

1. The NPC form's faction select lists the rows of the `faction` table, by name, alphabetically. No message keys: a faction's name is campaign content, written once by the DM, never translated (ADR-0006's category 3).
2. Choosing one and saving writes its `id` to `npc.faction`, exactly as today. The stored representation does not change.
3. The NPC list, the NPC card and the faction filter all display that faction's current `name`, read from the table.
4. Renaming the faction changes what all three display, on the next request. Nothing is backfilled because nothing was copied.

**Edge cases**

| Situation                                                       | Expected behaviour                                                                                                                                                                                                                                        |
| --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty `faction` table (fresh installation)                      | The select shows its placeholder and offers nothing. **`npc.faction` must therefore become nullable** — see §6; today it is a non-null `Int` with an FK, so a fresh install could not create an NPC at all. This is the one schema change the spec needs. |
| A faction is deleted while NPCs reference it                    | Refused by the existing `onDelete: Restrict`. The UI reports which NPCs still belong to it rather than surfacing a Prisma error.                                                                                                                          |
| A submitted faction id does not exist                           | Rejected as a **field-level** error on the form, not a 500. The FK raises Prisma `P2003`; the mutation boundary maps it to `{ faction: [...] }` — see §7.                                                                                                 |
| Two factions with the same name                                 | Allowed. Names are the DM's content, not identifiers; the `id` distinguishes them. No unique constraint.                                                                                                                                                  |
| A faction is renamed between rendering a form and submitting it | The submit still succeeds — the id is what is stored, and the id did not change.                                                                                                                                                                          |
| A faction is added in another tab                               | It appears on the next request. There is no client cache to invalidate.                                                                                                                                                                                   |
| An NPC row holds a faction id that predates the FK              | Cannot happen: SPEC-004 T1 seeded the table from `factions.ts` preserving every id, including the gaps at 9 and 20, and the FK has been enforced since. Rows were verified at migration time.                                                             |
| A field declares both static options and a table                | Unrepresentable — the two are mutually exclusive in the type (§7), so it is a compile error, not a runtime one.                                                                                                                                           |

## 6. Data model changes

**Almost none — and that is the point.** SPEC-004 T1 already shipped the table and the foreign key:

```prisma
model faction {
  id   Int    @id
  name String
  npc  npc[]
}
```

Two changes are needed, both small, and both are consequences of T1 having been scoped to schema-only:

```prisma
model faction {
  id   Int    @id @default(autoincrement())   // ← was bare @id
  name String
  npc  npc[]
}

model npc {
  // ...
  faction    Int?    @map("fazione")           // ← was non-null
  factionRef faction? @relation(fields: [faction], references: [id], onDelete: Restrict)
}
```

- **`@default(autoincrement())` on `faction.id`.** T1 preserved the legacy ids verbatim — including the gaps at 9 and 20 — which meant the column has no sequence at all. **The DM literally cannot insert a faction today without supplying an id by hand.** The migration adds the sequence and sets it past the current maximum, so new factions get ids after the legacy block and no existing row is touched.
- **`npc.faction` becomes nullable.** Required by the empty-installation case in §5: a non-null FK makes "create an NPC before inventing any factions" impossible. This is a widening, so every existing row stays valid.

- **Backfill needed?** No. Every `npc.faction` value already points at a real `faction` row — T1's FK has been enforcing that since it shipped.
- **Reversible?** Yes, and cheaply. Narrowing `faction` back to non-null needs no data change while every row still has a value; dropping the sequence is a one-line down migration. Nothing here is a point of no return, unlike SPEC-004 T5b.

## 7. Metadata changes

This is the substance of the spec.

### The declaration: a source, not the data

`PageMeta.options` stays exactly as it is for the twenty static fields. A second, **mutually exclusive** field declares a table source:

```ts
// app/lib/definitions/interfaces/meta/PageMeta.ts

/** Tables whose rows can back a field's options. Closed, like `PlaceKind`. */
type OptionTableName = "faction";

interface StaticOptionsMeta {
  options?: SelectOption[];
  optionTable?: never;
}

interface TableOptionsMeta {
  options?: never;
  optionTable: OptionTableName;
}

type OptionsDeclaration = StaticOptionsMeta | TableOptionsMeta;
```

`PageMetaBase` intersects with `OptionsDeclaration`. Declaring both is a compile error rather than a state some consumer has to arbitrate — the same "make the wrong state unrepresentable" argument ADR-0009 used for deriving `navigable` from `kind` instead of storing it.

**Why an intersection rather than reshaping `options` into a discriminated union** (`{ source: "static", values } | { source: "table", table }`): the union is arguably cleaner, but it rewrites all twenty static declarations for zero behavioural gain, and this project has been bitten before by wide mechanical edits to the metadata layer that the compiler only half-verified (TD-19's two near-misses). The additive form leaves the static path byte-identical and confines the diff to the fields that actually change. Recorded here so it is not re-proposed as an improvement.

### Resolution: request scope, server side

```ts
// app/lib/data/options/fetchFieldOptions.ts
export default async function fetchFieldOptions(
  table: OptionTableName
): Promise<ResolvedOption<number>[]>;
```

Reads the rows and maps them to the shape the layer already speaks — `{ value: row.id, label: row.name }`. Note it returns `ResolvedOption`, not `SelectOption`: a row's name is already the display string, so it skips `resolveOptions`' translator step entirely. That is ADR-0007's boundary holding, not being bypassed — content does not have a message key to resolve.

The per-request result is carried as a bundle:

```ts
type OptionBundle = Partial<Record<OptionTableName, ResolvedOption<number>[]>>;
```

**The bundle is resolved on the server and passed down as a prop**, exactly the pattern SPEC-004 T5a established for derived placements: `EntityList` and `EntityLibrary` are server components that already fetch and hand results to client children. `Select` and `SelectButtonery` receive resolved options either way and do not learn that a new kind of field exists.

A Server Action (the `fetchLinkableEntities` shape) is the alternative, and is right when the consumer is inside an already-client tree with no server ancestor to thread a prop from — `MapPOIPanel`'s situation, not this one. Prop-threading avoids a round trip and keeps the options resolved at the same moment as the rows they label.

### `resolveFieldValue` gains one optional parameter

```ts
resolveFieldValue(meta, value, t, useShort?, bundle?)
```

When `meta.optionTable` is set it reads `bundle[meta.optionTable]`; otherwise it behaves exactly as now. One function, one path, one extra branch — not a parallel resolver. A table-backed field rendered without a bundle displays nothing rather than throwing, the same degradation `getDataLabel` already gives an unmatched value.

### `defaultValue` and `validator` — the two module-scope consumers

These are the ones that made this hard, and each has an answer that avoids going async.

**`defaultValue`.** `firstOptionValue(list)` has no list to read. A table-backed field declares **no default** — its `defaultValue` is `null`, meaning "nothing preselected", and the select shows its placeholder. This is the honest representation: on a fresh installation there is genuinely no first faction. `IntegerFieldMeta.defaultValue` widens to `number | null` for the table variant only.

**`validator` — the FK does the membership check, so `buildEntitySchema` stays synchronous.**

`optionValueValidator(factions)` builds a `Set` from a static array at import time (TD-61). A table-backed list cannot be checked that way without querying, and querying inside a Zod schema would make `buildEntitySchema` async — which would ripple into `createNpc`, `updateNpc` and every other mutation, i.e. the exact boundary non-negotiable rule #2 protects.

It does not need to. **`optionValueValidator` exists because there was no foreign key.** There is one now: `factionRef ... onDelete: Restrict`. Postgres already refuses a `faction` value that is not a real row, transactionally, and cannot go stale the way a module-scope `Set` can. So a table-backed field's validator is simply `z.number().int().nullable()`, and membership moves from Zod to the database — a strictly stronger check in a strictly better place.

The cost is **where the error appears**: a Zod failure is a field error before the query; an FK violation is a Prisma error after it. So the mutation boundary must map Prisma's `P2003` to a field-level error keyed by the offending field, so the form says "that faction no longer exists" instead of returning a 500. That mapping is the one genuinely new piece of error-handling work in this spec, and it belongs beside the existing typed-error hierarchy (TD-13, `toDatabaseError`).

## 8. Acceptance criteria

- [ ] A field declaring `optionTable: "faction"` renders its dropdown from the `faction` table, by name, alphabetically.
- [ ] A field declaring both `options` and `optionTable` does not compile.
- [ ] The twenty static option-backed fields render, filter, validate and default exactly as before — verified by the existing suites passing unchanged, with no edits to their declarations.
- [ ] `buildEntitySchema` is still synchronous, and no mutation signature became `async` that was not already.
- [ ] Renaming a faction row changes the label in the NPC list, the NPC card and the filter, with no other write.
- [ ] Deleting a faction that NPCs reference is refused, and the DM is told which NPCs block it — not shown a Prisma error.
- [ ] Submitting a faction id that does not exist yields a field-level error on `faction`, not a 500.
- [ ] An NPC can be created on an installation whose `faction` table is empty.
- [ ] A faction can be created without supplying an id by hand.
- [ ] A table-backed field rendered without an option bundle degrades to a blank label rather than throwing.
- [ ] Every new mutation rejects an unauthenticated request and validates input with a Zod schema.
- [ ] Coverage has not dropped.

## 9. Implementation plan

**Files touched, in order**

| #   | File                                                                        | Change                                                                                                 |
| --- | --------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| 1   | `prisma/schema.prisma` + migration                                          | `faction.id` autoincrement with the sequence set past the legacy block; `npc.faction` nullable         |
| 2   | `app/lib/definitions/interfaces/meta/PageMeta.ts`                           | `OptionTableName`, the mutually-exclusive `OptionsDeclaration`, nullable default for the table variant |
| 3   | `app/lib/data/options/fetchFieldOptions.ts`                                 | new — rows → `ResolvedOption<number>[]`                                                                |
| 4   | `app/lib/utils/data/resolveFieldValue.ts`                                   | optional bundle parameter, one branch                                                                  |
| 5   | `app/lib/errors/` + `createNpc`/`updateNpc`                                 | map Prisma `P2003` to a field-level error                                                              |
| 6   | `app/ui/components/EntityList.tsx`, `EntityLibrary.tsx`                     | resolve the bundle, thread it down (the T5a `placements` pattern)                                      |
| 7   | `app/ui/npc/NpcCard.tsx`, `NpcLibrary.tsx`, `SelectButtonery`, `EntityForm` | accept and use the bundle                                                                              |
| 8   | `app/lib/config/npc/npcMeta.ts`                                             | `faction` switches from `options: factions` to `optionTable: "faction"`                                |
| 9   | `app/lib/data/faction/*`                                                    | create / rename / delete, each guarded and validated                                                   |
| 10  | `app/lib/config/npc/factions.ts`, `messages/{it,en}.json`                   | delete the static list and its 21 catalogue keys — **last**, once 1–9 are proven                       |

**Risks**

- **The bundle has to reach four different consumers, two of them client components.** If threading it proves uglier than expected in `EntityForm`, the fallback is the `fetchLinkableEntities` Server Action shape — worse (a round trip, and options resolving at a different moment than the rows) but known to work. Decide by trying the prop first, not by debating it.
- **`P2003` mapping is new error-handling surface** on the mutation path, which is the most safety-critical code in the app. It needs its own tests, not just the happy path.
- **Step 10 is irreversible-ish** in the same way SPEC-004 T5b is: once the catalogue keys are gone, reverting means re-authoring them. Keep it last and separate.
- **Scope creep toward "make everything a table"** is the likely failure of this spec. §3 exists to prevent it; the classification in SPEC-003 §6 is the authority on what stays static.

**Open questions**

1. **Does `faction` get an admin UI in this spec, or a minimal inline "add faction" in the NPC form?** §3 rules out a full catalogue page, but the DM still needs some way to create one. A small managed list — reachable from the NPC form — is the cheapest thing that satisfies §4's first story. Needs a decision before T4 below.
2. **Should `npc.faction` becoming nullable be surfaced in the UI as "no faction", or should the form require one once at least one faction exists?** The former is simpler and matches the data; the latter matches how the DM has used the field so far (every one of the 119 NPCs has a faction).
3. **Is `OptionTableName` worth being a union of one?** It is, briefly: it names the concept and makes the second table (whenever it comes) additive. But if nothing joins `faction` within a couple of features, the indirection should be collapsed rather than kept for symmetry.

## 10. Task breakdown

- [ ] **T1** — Schema: `faction.id` autoincrement with the sequence set past the legacy maximum; `npc.faction` nullable _(test: a faction inserts without an explicit id; an NPC saves with a null faction; every existing row still reads back)_
- [ ] **T2** — `PageMeta`'s `OptionsDeclaration`, static path untouched _(test: declaring both `options` and `optionTable` fails to compile — a `@ts-expect-error` fixture; all twenty static fields unchanged and their suites green)_
- [ ] **T3** — `fetchFieldOptions` + `resolveFieldValue`'s bundle branch _(test: rows map to `{value, label}` sorted by name; a table-backed field with no bundle renders blank rather than throwing)_
- [ ] **T4** — Faction create/rename/delete, guarded and validated, with whatever minimal UI open question 1 settles on _(test: unauthenticated is rejected; delete-while-referenced is refused and names the blocking NPCs)_
- [ ] **T5** — `P2003` → field-level error on the mutation boundary _(test: a create with a non-existent faction id returns `{ faction: [...] }`, not a 500)_
- [ ] **T6** — Thread the bundle through `EntityList`, `EntityLibrary`, cards, `SelectButtonery`, `EntityForm`; switch `npcMeta.faction` to `optionTable` _(test: list, card and filter all show a renamed faction's new name after one rename and no other write)_
- [ ] **T7** — Delete `factions.ts` and its 21 catalogue keys from both locales _(test: TD-21's key-set check stays green; no orphan keys remain)_

## 11. Outcome

_Fill in at close._

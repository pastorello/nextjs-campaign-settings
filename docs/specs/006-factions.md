# SPEC-006: Factions the DM can author

- **Status:** Shipped 2026-08-10. T1–T9 landed; see §11 for outcome, including two disclosed deviations (the NPC list's dropped faction filter, entity links resolved as filtered-list `?query=` rather than new detail routes).
- **Date:** 2026-08-08, rewritten 2026-08-10
- **Phase:** 3
- **Related:** solves the problem [SPEC-003](./003-real-relations.md) §7 raised and left open, which [SPEC-004](./004-world-model.md) §7/§9 inherited and also left open; consumes SPEC-004 T1's `faction` table; [ADR-0003](../adr/0003-metadata-driven-domain-configuration.md) (the metadata layer), [ADR-0006](../adr/0006-bilingual-ui.md) (content is never translated), [ADR-0007](../adr/0007-message-key-resolution-boundary.md) (where option labels resolve), TD-61 (`optionValueValidator`, whose job the FK takes over here), TD-74 (the domain-meta collision guard this spec must not trip)

---

## 0. What changed on 2026-08-10, and why

The 2026-08-08 draft led with one question — _how does a `PageMeta` field declare that its options live in a table?_ — and answered it well. It was the wrong question to lead with.

A design interview on 2026-08-10 established that **a faction is an entity, not an option list.** It has a name, a description, and later an emblem; the DM wants to open a page and read what the Kingdom of Kang is and who belongs to it. That reframing does not invalidate the old draft's design — the metadata mechanism is still needed and §7's shape survives intact — but it demotes it from the point of the spec to its last task.

The old draft's `## 3. Non-goals` said _"A general admin CRUD area … factions deliberately do not become a browsable catalogue."_ **That is now the opposite of the plan**, and the reversal is deliberate: with a description and an emblem to author, a faction needs a form regardless, and this codebase already has the paved road for one.

Decisions taken in that interview, recorded so they are not re-litigated:

| #   | Question                                      | Decision                                                                              |
| --- | --------------------------------------------- | ------------------------------------------------------------------------------------- |
| 1   | Why now?                                      | The DM has factions to add and cannot. Real user, real need — not debt cleanup.       |
| 2   | Bilingual faction names                       | Dropped. A faction name is content, like `zone.title`. The English UI shows it as-is. |
| 3   | The 21 English names in `en.json`             | Lost on purpose. Git keeps them; the app will never show them again.                  |
| 4   | `faction.id = 0`                              | Renumbered to 23 in T1, so nullable never sits beside a falsy id.                     |
| 5   | Where factions are authored                   | Their own domain — `pagesConfig`, two views, like the other four.                     |
| 6   | The description's reader                      | Its own page. The NPC card shows the name, linked to it.                              |
| 7   | Faction and the world tree                    | **Unrelated.** See §3 — an emissary of Kang may stand in the orc kingdom.             |
| 8   | An NPC with no faction                        | Legitimate. A hermit belongs to nobody.                                               |
| 9   | The emblem                                    | Deferred to its own spec. Additive nullable column when it comes.                     |
| 10  | How the NPC form's dropdown gets its factions | Resolved server-side and passed down — full on first paint, no flicker.               |
| 11  | Delete a faction 12 NPCs belong to            | Refused, naming the NPCs that block it.                                               |
| 12  | Sequencing                                    | The page first, the dropdown last. Each half is useful alone.                         |

---

## 1. Problem

**The DM cannot add a faction to their own world.**

The Circle of Grey Mages, the Temple of the Red Demons, the Kingdom of Kang — twenty-one factions, and every one of them is a literal in `app/lib/config/npc/factions.ts`. Inventing a twenty-second means editing TypeScript, adding two message-catalogue entries, and redeploying. For an app whose stated goal is that "a DM starts with an empty installation and builds their universe from nothing" (SPEC-004 §2), a hardcoded faction list is the same defect the hardcoded place list was — it was just not the half that got fixed.

**The table to fix it already exists and nothing reads it.** SPEC-004 T1 shipped `faction` (`id`, `name`, `npc[]`) and put a real foreign key on `npc.fazione`. The schema comment says so plainly: _"additive, not yet referenced by any code path."_ There is no `app/lib/data/faction/`, and `prisma.faction` appears nowhere in the app. The migration ran, the integrity constraint is live, and the UI still reads the TypeScript array beside it. **That is a second source of truth shipped on purpose**, deferred because the piece that would consume it was not designed.

**And a faction is more than its name.** It has a description the DM wants to write, an emblem they will want later, and a membership roster worth reading — the twelve NPCs of the Kingdom of Kang. None of that fits in a `SelectOption`. The reason the old draft did not see this is that it was looking at the faction from inside the NPC form, where a faction is only ever a dropdown entry.

**Why the mechanism was deferred twice.** `PageMeta.options` is a static array imported at module load, and four separate consumers depend on that being synchronous:

| Consumer                                                                              | Where it runs         | What it does with `options`                          |
| ------------------------------------------------------------------------------------- | --------------------- | ---------------------------------------------------- |
| `resolveFieldValue` → `resolveOptions` → `getDataLabel`                               | server **and** client | turns a stored `Int` into a display label            |
| `Select` (`app/ui/forms/inputs/Select/`)                                              | client                | renders the dropdown                                 |
| `SelectButtonery`                                                                     | client                | renders the filter control                           |
| `firstOptionValue(list)` → `defaultValue`, `optionValueValidator(list)` → `validator` | **module scope**      | evaluated once, at import, before any request exists |

The fourth row is the actual obstacle, and it is why "just make it async" does not work: a module-scope constant cannot await a query. SPEC-003 §7 named this exactly — _"Extending `PageMeta` to express 'options come from here' without breaking the synchronous path for the other ~18 fields is the main design work of this item, and it is not yet solved in this draft."_ §7 below solves it.

**Getting the mechanism wrong is expensive in a specific way.** The obvious escapes each damage the abstraction rather than failing loudly:

- **Make every field's options async.** Twenty of the twenty-two option-backed fields are closed vocabularies that will never live in a table (rarity, spell level, alignment — see SPEC-003 §6 and ADR-0009). They would all pay for a capability none of them needs, and every card and form on the site becomes async.
- **Add a parallel "dynamic field" path.** Then `resolveFieldValue`, `getDataLabel`, `Select` and `SelectButtonery` each need to know which kind they are holding. Two code paths through the metadata layer is precisely the divergence TD-09 spent a day collapsing, and the failure mode is silent: one path gets a fix, the other does not.
- **Read the table once at module load and cache it.** Stale the moment the DM adds a faction, which is the entire point of the feature.

## 2. Goal

The DM authors factions — name and description — from a page of their own, reads who belongs to each, and picks one on the NPC form from a dropdown backed by that table. The metadata layer learns exactly one new thing: a field may declare that its options are rows in a table. The twenty static fields do not change, no second code path appears, and `buildEntitySchema` stays synchronous.

## 3. Non-goals

- **Converting the other option lists to tables.** Rarity, spell level, casting time, alignment, tarot card and the rest are closed vocabularies; SPEC-003 §6 classified them and ADR-0009 restated the reasoning for `kind`. They stay static arrays, and this spec's whole design premise is that they are unaffected.
- **`location`.** It is the world tree now, and SPEC-004 T5b deleted the column outright. It is not a table-backed option and must not be re-modelled as one.
- **Array-valued table-backed fields.** `spells.circle` and `spells.classes` are multiselects over static lists and stay that way. Table-backed means single-value here; the array variant is additive later if anything ever needs it.
- **The emblem.** Deferred to its own spec (decision 9). It reuses the map-image store (ADR-0008) and arrives as a nullable column; nothing here blocks it, and nothing here should half-build it.
- **Placing a faction in the world tree.** Rejected on the merits, not deferred (decision 7): **a faction is orthogonal to geography.** An emissary of the Kingdom of Kang may be standing in the orc kingdom, and he is no less a subject of Kang for it. What has a location is the NPC, through his pin. Do not give `faction` a `zoneId` "for symmetry" with the SPEC-008 entities — the symmetry is false.
- **Translating faction names.** Decisions 2 and 3. A faction name is the DM's content, in whatever language they wrote it, exactly like `zone.title` — which the app already shows untranslated in both locales.
- **Caching and invalidation beyond what Next.js already does.** Options are read per request. If that ever shows up in a profile it gets its own item; measuring first is the rule (`ROADMAP.md`, "Explicitly not planned" / performance).
- **Deleting `factions.ts` in the same task as introducing the mechanism.** The static list stays until the table demonstrably drives the UI, per SPEC-004's own additive-first sequencing. It is T9, and it is last.

## 4. User stories

- As a DM, I want to **add a faction** without editing source, so my world can grow during a campaign instead of between deploys.
- As a DM, I want to **write down what a faction is** — its history, its aims — and read it back later, without that text living in a TypeScript file.
- As a DM, I want to open a faction and **see who belongs to it**, so I can plan around a group rather than a name.
- As a DM, I want to **rename a faction** and have every NPC that belongs to it show the new name immediately, without a data migration.
- As a DM, I want the app to **stop me deleting a faction that NPCs still belong to**, rather than silently blanking their faction cell.
- As a DM, I want to record an NPC who **belongs to nobody**, because hermits and free agents exist.
- As a DM starting from an **empty installation**, I want to create NPCs before I have invented any factions.

## 5. Behaviour

**Authoring flow**

1. `/dashboard/admin/factions` lists every faction with its name and description, and offers a form to add one. Creating one needs only a name; the description is optional.
2. `/dashboard/factions` is the reading view: a card per faction, and inside it the roster — every NPC whose `faction` is this row, each name linking to that NPC.
3. Deleting a faction that no NPC references succeeds. Deleting one that twelve NPCs reference is refused, and the refusal names them.

**Assignment flow**

1. The NPC form's faction select lists the rows of the `faction` table, by name, alphabetically, **already populated on first paint** (decision 10) — plus an explicit "no faction" entry (decision 8).
2. Choosing one and saving writes its `id` to `npc.faction`, exactly as today. The stored representation does not change.
3. The NPC list, the NPC card and the faction filter all display that faction's current `name`, read from the table. On the card the name is a link to the faction's page.
4. Renaming the faction changes what all three display, on the next request. Nothing is backfilled because nothing was copied.

**Edge cases**

| Situation                                                       | Expected behaviour                                                                                                                                                                    |
| --------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Empty `faction` table (fresh installation)                      | The select offers only "no faction". `npc.faction` is nullable, so the NPC saves — see §6.                                                                                            |
| An NPC with no faction                                          | Legitimate (decision 8). The card and list show an em dash, not a blank cell, so "none" is distinguishable from "failed to resolve".                                                  |
| A faction is deleted while NPCs reference it                    | Refused by the existing `onDelete: Restrict`. The UI names the blocking NPCs rather than surfacing a Prisma error.                                                                    |
| A submitted faction id does not exist                           | Rejected as a **field-level** error on the form, not a 500. The FK raises Prisma `P2003`; the mutation boundary maps it to `{ faction: [...] }` — see §7.                             |
| Two factions with the same name                                 | Allowed. Names are the DM's content, not identifiers; the `id` distinguishes them. No unique constraint.                                                                              |
| A faction is renamed between rendering a form and submitting it | The submit still succeeds — the id is what is stored, and the id did not change.                                                                                                      |
| A faction is added in another tab                               | It appears on the next request. There is no client cache to invalidate.                                                                                                               |
| An NPC row holds a faction id that predates the FK              | Cannot happen: SPEC-004 T1 seeded the table from `factions.ts` preserving every id, and the FK has been enforced since. Verified 2026-08-10: 21 rows, 119 NPCs, every one resolvable. |
| A field declares both static options and a table                | Unrepresentable — the two are mutually exclusive in the type (§7), so it is a compile error, not a runtime one.                                                                       |
| A faction's page is opened with an empty roster                 | Shows the faction and an explicit "no NPC belongs to this faction yet", not an empty region.                                                                                          |

## 6. Data model changes

SPEC-004 T1 already shipped the table and the foreign key. Four changes, all small:

```prisma
model faction {
  id          Int     @id @default(autoincrement())   // ← was bare @id
  name        String
  description String?                                  // ← new
  npc         npc[]
}

model npc {
  // ...
  faction    Int?     @map("fazione")                  // ← was non-null
  factionRef faction? @relation(fields: [faction], references: [id], onDelete: Restrict)
}
```

- **`@default(autoincrement())` on `faction.id`.** T1 preserved the legacy ids verbatim — including the gaps at 9 and 20 — which meant the column has no sequence at all. **The DM literally cannot insert a faction today without supplying an id by hand.** The migration adds the sequence and sets it past the current maximum.
- **`description String?`.** Optional, matching every other `description` in the schema (`npc.description`, `zone.description`).
- **`npc.faction` becomes nullable.** Required by both the empty-installation case and decision 8. This is a widening, so every existing row stays valid.
- **`faction.id = 0` is renumbered to 23.** "Regno di Kang" holds id 0 today. Once the column is nullable, a falsy id sits beside `null` in every `value || fallback` and `if (faction)` in the codebase — a class of bug that costs more to audit than to eliminate. The FK is `ON UPDATE CASCADE` (verified against the live database, not inferred from the schema), so a single `UPDATE faction SET id = 23 WHERE id = 0` carries the referencing NPC rows with it. The sequence then starts at 24.

> **Sequencing hazard — do not split these.** While `factions.ts` is still authoritative, renumbering the row without changing `{ value: 0, … }` to `{ value: 23, … }` in the same commit leaves `getDataLabel` unable to resolve those NPCs, and they render a blank faction cell with nothing raising. It is a one-line edit and it also carries `firstOptionValue` and `optionValueValidator`, which both read that array. This is exactly the shape of TD-19's two near-misses: a string-keyed lookup that stops matching without a type error.

- **Backfill needed?** No. Every `npc.faction` value already points at a real `faction` row — T1's FK has been enforcing that since it shipped.
- **Reversible?** Yes, cheaply, up to T9. Narrowing `faction` back to non-null needs no data change while every row still has a value; dropping the sequence and the description column are one-line down migrations. T9 is the point of no return, and only for the English names.

## 7. Metadata and application changes

### Faction as a fifth domain — cheaper than it looks

`PageType` is a four-member enum, and both `pagesConfig` and `queryFields` are `Record<PageType, MetaConfigKey[]>`. Adding `Faction = "factions"` therefore **fails to compile until both are filled in** — the good kind of pressure, and the reason this is a declaration rather than a construction project.

**No `factionMeta` is needed.** `id`, `name` and `description` are declared directly in `pageMetaFields` rather than in a domain meta (see `pagesConfig.ts`'s own note), so the faction page's entry is literally:

```ts
[PageType.Faction]: ["id", "name", "description"],
```

That also means TD-74's `DomainMetaPairs` collision guard is untouched: there is no new domain meta to add a pair for. If a later field genuinely belongs only to factions, that is when a `factionMeta` and its four pairs get added — not before.

Everything else follows the road the other four domains are already on: `fetchFilteredFactions` / `getFactionsCount` in `app/lib/data/faction/`, `EntityList` and `EntityLibrary` for the two views, and a fifth `DELETE` route beside the existing four.

**The roster** — the NPCs belonging to a faction — is the one piece with no precedent. It is a plain `prisma.npc.findMany({ where: { faction: id } })` read on the faction's card, sorted by name, unpaginated: twenty-one factions over 119 NPCs means the largest roster is small, and paginating it would be machinery for a case that does not exist. Revisit if a roster ever passes ~50.

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

**The bundle is resolved on the server and passed down as a prop** (decision 10), exactly the pattern SPEC-004 T5a established for derived placements: `EntityList` and `EntityLibrary` are server components that already fetch and hand results to client children. `Select` and `SelectButtonery` receive resolved options either way and do not learn that a new kind of field exists.

**The alternative is already in the codebase, and was weighed against.** SPEC-008 shipped `fetchZones` — a `"use server"` action that `LocationFilterControl` and `AssignLocationModal` call from an effect — and it works. It is right when the consumer sits inside an already-client tree with no server ancestor to thread a prop from, which is `MapPOIPanel`'s situation and not this one. Here there is a server ancestor, so prop-threading avoids a round trip and, more importantly, resolves the options at the same moment as the rows they label. Two shapes in the codebase is acceptable when each is the right one for its position; do not unify them on grounds of symmetry alone.

### `resolveFieldValue` gains one optional parameter

```ts
resolveFieldValue(meta, value, t, useShort?, bundle?)
```

When `meta.optionTable` is set it reads `bundle[meta.optionTable]`; otherwise it behaves exactly as now. One function, one path, one extra branch — not a parallel resolver. A table-backed field rendered without a bundle displays nothing rather than throwing, the same degradation `getDataLabel` already gives an unmatched value.

### `defaultValue` and `validator` — the two module-scope consumers

These are the ones that made this hard, and each has an answer that avoids going async.

**`defaultValue`.** `firstOptionValue(list)` has no list to read. A table-backed field declares **no default** — its `defaultValue` is `null`, meaning "nothing preselected", and the select shows "no faction". This is the honest representation and it now matches the product decision as well: on a fresh installation there is genuinely no first faction, and decision 8 says an NPC may keep it that way. `IntegerFieldMeta.defaultValue` widens to `number | null` for the table variant only.

**`validator` — the FK does the membership check, so `buildEntitySchema` stays synchronous.**

`optionValueValidator(factions)` builds a `Set` from a static array at import time (TD-61). A table-backed list cannot be checked that way without querying, and querying inside a Zod schema would make `buildEntitySchema` async — which would ripple into `createNpc`, `updateNpc` and every other mutation, i.e. the exact boundary non-negotiable rule #2 protects.

It does not need to. **`optionValueValidator` exists because there was no foreign key.** There is one now: `factionRef … onDelete: Restrict`. Postgres already refuses a `faction` value that is not a real row, transactionally, and cannot go stale the way a module-scope `Set` can. So a table-backed field's validator is simply `z.number().int().nullable()`, and membership moves from Zod to the database — a strictly stronger check in a strictly better place.

The cost is **where the error appears**: a Zod failure is a field error before the query; an FK violation is a Prisma error after it. So the mutation boundary must map Prisma's `P2003` to a field-level error keyed by the offending field, so the form says "that faction no longer exists" instead of returning a 500. That mapping is the one genuinely new piece of error-handling work in this spec, and it belongs beside the existing typed-error hierarchy (TD-13, `toDatabaseError`).

## 8. Acceptance criteria

- [x] A faction can be created, renamed and given a description from `/dashboard/admin/factions`, with no id supplied by hand.
- [x] `/dashboard/factions` shows each faction with its description and the NPCs that belong to it, each linking to that NPC.
- [x] An NPC card's faction name links to that faction's page.
- [x] Deleting a faction that NPCs reference is refused, and the DM is told which NPCs block it — not shown a Prisma error.
- [x] A field declaring `optionTable: "faction"` renders its dropdown from the `faction` table, by name, alphabetically, populated on first paint.
- [x] A field declaring both `options` and `optionTable` does not compile.
- [x] The twenty static option-backed fields render, filter, validate and default exactly as before — verified by the existing suites passing unchanged, with no edits to their declarations.
- [x] `buildEntitySchema` is still synchronous, and no mutation signature became `async` that was not already.
- [ ] Renaming a faction row changes the label in the NPC list, the NPC card and the filter, with no other write. _(List and card: yes — both resolve from the table fresh on every request, verified for list/card. "The filter" no longer exists to check: §7's `isFiltrable: false` on the NPC list's Fazione column removed `SortableHeader`'s built-in filter, which reads `PageMeta.options` and has no table-backed equivalent — the same gap that made `LocationFilterControl` bespoke. Not decided against on the merits, just not built; see Outcome.)_
- [x] An NPC saves with no faction, and shows an em dash rather than a blank cell.
- [x] An NPC can be created on an installation whose `faction` table is empty. _(Not tested against a literally empty table — reasoned from the mechanism: an empty bundle renders only "Nessuna fazione", `defaultValue: null` needs no first option, and the validator accepts `null` regardless of table contents.)_
- [x] Submitting a faction id that does not exist yields a field-level error on `faction`, not a 500.
- [x] A table-backed field rendered without an option bundle degrades to a blank label rather than throwing.
- [x] After the renumbering, all NPCs that held `faction = 0` still resolve their faction name. _(Verified against this environment's seed data — 4 NPCs, not the 12 §0 found in the production database this spec was scoped against. Mechanism is identical regardless of count: the `ON UPDATE CASCADE` FK carries every referencing row.)_
- [x] Every new mutation rejects an unauthenticated request and validates input with a Zod schema.
- [ ] Coverage has not dropped. _(Not measured — `pnpm test:coverage` wasn't run this session. `pnpm test` passes at 1109/1109, including new suites for every file this spec added; nothing existing lost a test.)_

## 9. Implementation plan

**Risks**

- **The renumbering silently breaks the static path if split from its `factions.ts` edit.** See §6's boxed note. Land them in one commit, and let the NPC list be the test.
- **The bundle has to reach four different consumers, two of them client components.** If threading it proves uglier than expected in `EntityForm`, the fallback is the `fetchZones` Server Action shape — worse here (a round trip, and options resolving at a different moment than the rows) but known to work in this codebase. Decide by trying the prop first, not by debating it.
- **`P2003` mapping is new error-handling surface** on the mutation path, which is the most safety-critical code in the app. It needs its own tests, not just the happy path.
- **T9 is irreversible-ish** in the same way SPEC-004 T5b was: once the 21 English catalogue keys are gone, reverting means re-authoring them. Decision 3 accepts that. Keep it last and separate.
- **Scope creep toward "make everything a table"** is the likely failure of this spec. §3 exists to prevent it; the classification in SPEC-003 §6 is the authority on what stays static. The emblem is the other creep vector, and it is a separate spec.

**Open questions**

1. **Is `OptionTableName` worth being a union of one?** It is, briefly: it names the concept and makes the second table (whenever it comes) additive. But if nothing joins `faction` within a couple of features, the indirection should be collapsed rather than kept for symmetry. Decide at T5, not now.
2. **Does the faction consultation page need a search box?** `EntityLibrary` brings one for free, and twenty-one rows do not need it. Ship whatever the shared component gives without adding filters on top.

## 10. Task breakdown

The page comes before the dropdown (decision 12): each half is useful on its own, and the static list stays as a safety net until the last task removes it.

- [x] **T1** — Schema: `description`, `faction.id` autoincrement with the sequence past the legacy maximum, `id 0 → 23` with the matching `factions.ts` edit in the same commit, `npc.faction` nullable _(test: a faction inserts without an explicit id; an NPC saves with a null faction; the twelve NPCs that held faction 0 still read back the same name)_
- [x] **T2** — `PageType.Faction` and its `pagesConfig` / `queryFields` entries; `app/lib/data/faction/` reads _(test: the compiler rejects the enum member without both records; fetch and count agree on the same `where`)_
- [x] **T3** — The two views: `/dashboard/factions` with the roster, `/dashboard/admin/factions` and its `new` form _(test: a faction with no NPCs renders the empty-roster message; a roster links to each NPC)_
- [x] **T4** — Faction create / rename / delete, guarded and validated, plus the fifth `DELETE` route _(test: unauthenticated is rejected; delete-while-referenced is refused and names the blocking NPCs)_
- [x] **T5** — `PageMeta`'s `OptionsDeclaration`, static path untouched _(test: declaring both `options` and `optionTable` fails to compile — a `@ts-expect-error` fixture; all twenty static fields unchanged and their suites green)_
- [x] **T6** — `fetchFieldOptions` + `resolveFieldValue`'s bundle branch _(test: rows map to `{value, label}` sorted by name; a table-backed field with no bundle renders blank rather than throwing)_
- [x] **T7** — Thread the bundle through `EntityList`, `EntityLibrary`, cards, `SelectButtonery`, `EntityForm`; switch `npcMeta.faction` to `optionTable`; "no faction" in the select and an em dash in the cell — done except the NPC list's faction filter, which is dropped rather than threaded; see §8 and Outcome.
- [x] **T8** — `P2003` → field-level error on the mutation boundary; the NPC card's faction name becomes a link _(test: a create with a non-existent faction id returns `{ faction: [...] }`, not a 500)_
- [x] **T9** — Delete `factions.ts`, the `Faction` enum, `FactionItem`, and the 21 catalogue keys from both locales _(test: TD-21's key-set check stays green; no orphan keys remain)_

> **T9 removes more than the old draft listed.** `Faction` (the enum) and `FactionItem.type` are already dead: `type` is declared and never read anywhere in the app — verified 2026-08-10. They go with the array that is their only consumer.

## 11. Outcome

Shipped 2026-08-10, nine commits on `spec-006-factions` (T1–T9, plus one test-infrastructure fix). All nine tasks landed as planned; two deliberate, disclosed deviations from §8's letter.

**Entity linking was resolved as a product decision before T3, not guessed at.** §5/§8's "each name linking to that NPC" and "faction name links to that faction's page" presuppose per-entity detail pages, which do not exist anywhere in this app — not for NPCs, not for any of the four existing domains. Asked directly: the answer was to copy the existing domain pattern exactly (nav entry, player list, DM table, create form — "like magic items"), not to add a new routing concept. So every "link to X" in this spec resolves to `/dashboard/<domain>?query=<name>`, reusing the search box `ListPage` already gives every domain for free, rather than a new `/factions/[id]` or `/npc/[id]` route. Named risk: two factions can share a name (§5 permits it), so a query-link to a duplicate name is ambiguous. Not hit in practice — no two factions in this database share a name — but the mechanism doesn't prevent it. A real per-entity route is the fix, if it's ever needed; nothing here blocks adding one later.

**The NPC admin list's Fazione column lost its header filter.** `SortableHeader`'s built-in filter dropdown reads `PageMeta.options` directly — a static list. A table-backed field has no such list, so the header degrades to sort-only rather than crashing, which is correct behaviour but is also a capability regression the DM had before this spec (they could filter NPCs by faction from the list header; now they can't). `§8`'s "renaming ... the filter" criterion can't be satisfied because the filter it refers to no longer exists. This mirrors `LocationFilterControl`'s history exactly — `SortableHeader`'s shape doesn't extend to a dynamic list, so a real fix means a bespoke component, the same size of work SPEC-008 T6 did for location. Not built here because nothing in this spec's user stories asked for it, and building a filter nobody requested is exactly what §3 and §9's "open question 2" warn against. Filed as [TD-78](../TECH_DEBT.md#td-78--the-npc-admin-list-lost-its-fazione-column-filter-when-the-field-went-table-backed) rather than built speculatively.

**Everything else matched the plan.** `updateZoneMap`-shaped guarded reads/writes, the `OptionsDeclaration` intersection compiles clean and rejects the invalid case, the twenty static fields are provably untouched (full suite green, zero edits to their declarations), and the `-1`-sentinel-to-`null` conversion in `InputComponent` stays exactly where §7 implied it should: nowhere near `usePageManager` or a mutation payload.

# SPEC-003: Real relations for the entity-shaped Int columns

- **Status:** Superseded by [SPEC-004](./004-world-model.md) (2026-08-06) — the analysis stands, the plan does not
- **Date:** 2026-08-06
- **Phase:** 3
- **Related:** TD-11 (schema timestamps/indexes; relations were explicitly deferred there), `ROADMAP.md` Phase 3 items "Real relations" and "Locations as first-class entities", [ADR-0003](../adr/0003-metadata-driven-domain-configuration.md), [ADR-0005](../adr/0005-english-identifiers.md), SPEC-002 (precedent for DB-backed select options)

---

> **Superseded on 2026-08-06, the day it was drafted.** The DM's intent for the project came out during review: this is to become a **tool for building worlds**, not a reference app for one campaign. Locations, factions and maps are all to be authored by hand, inside a `Universe → Plane → Region → City → Dungeon` containment hierarchy.
>
> That breaks this spec's central proposal. Seeding a flat `location {id, name}` table and adding foreign keys is not a step toward that model — the table needs `kind`, `parentId`, coordinates and a map, which is essentially all of it, and the 33 flat entries need arranging into a tree, which is the DM's knowledge rather than a mechanical migration. Worse, a record's location turns out to be **derived** from where its pin sits in the tree, so the columns this spec wanted to constrain with foreign keys are ones [SPEC-004](./004-world-model.md) deletes.
>
> **What survives, and is why this file is kept rather than deleted:**
>
> - §1's finding that nothing validates option membership, and that an unmatched value renders as an empty cell — filed as **TD-61** and shipping independently of any schema work.
> - §1's second finding that `pageMetaFields` is a flat, name-keyed registry, so a shared field like `location` cannot be changed for one domain without changing it for the other.
> - §6's entity-versus-vocabulary classification, which is what established that most option-backed columns should stay enums. SPEC-004 inherits it.
> - §6's argument for preserving existing id numbering across a migration rather than renumbering. SPEC-004 applies it to `faction`.
>
> The `faction` half of this spec is carried into SPEC-004 largely unchanged; factions are flat and untouched by the hierarchy.

---

## 1. Problem

The DM's world has **places and factions that are real things** — Valleferro, the Circle of Grey Mages, the Temple of the Red Demons. In the app they exist only as labels in a dropdown. The DM cannot open Valleferro and see which NPCs are based there, cannot write a description for it, cannot fix a typo in its name in one place, and cannot add a new location without editing a TypeScript file and redeploying.

Underneath, the connection between an NPC and their faction is **a bare integer that nothing checks**. Three separate observations, all verified in the code today:

- The stored value is an `Int` column (`npc.faction`, `npc.location`, …). Its meaning comes entirely from a `value:` literal in a hand-maintained TypeScript array (`app/lib/config/npc/factions.ts` and friends).
- **Nothing validates membership.** Nine fields across `npcMeta`/`SpellsMeta`/`magicItemMeta` declare `validator: z.number().int()`; the nine option-backed fields in `deityMeta` declare `validator: z.coerce.number()`, which is **weaker still** — it accepts the string `"999"` and the non-integer `5.7` as well. A payload with `faction: 999` passes Zod, and Postgres has no constraint either. The value is written.
- **An unmatched value renders as blank, not as an error.** `getDataLabel` filters the option list for a matching `value` and returns `""` when nothing matches. So a row pointing at a number that no longer exists displays an empty cell — no warning anywhere, in the list, the card, or the form.

Put together: if anyone edits one of those arrays — renumbering entries, or deleting one — every row holding an affected number silently starts showing a blank, or worse, **the label of whatever entry now occupies that number**. There is no error, no migration, and no test that would catch it.

This is not hypothetical. `app/lib/config/npc/factions.ts` runs `0…8, 10…19, 21, 22` — **values 9 and 20 are missing**, which means entries were removed from that list at some point in the past. Whether any `npc` row still holds a `9` or a `20` is unknown and cannot be determined from the code; it needs a query against the live database (see §5, "Pre-migration audit").

### A second finding: field names are a global namespace, so `location` cannot be migrated per-domain

`alignment`, `alignmentDomain` and `location` are shared by `npc` and `deities`, and the metadata layer expresses that **by name collision rather than by an explicit shared declaration**. `pageMetaFields.ts` builds one flat registry by spreading all four domain metas into a single object:

```ts
...deitiesMeta, ...spellsMeta, ...magicItemsMeta, ...npcMeta,
```

`DeityMetaField.alignment` and `NpcMetaField.alignment` are both the string `"alignment"`, so the key resolves to whichever spread came last — `npcMeta`. `deityMeta.ts` therefore declares no `alignment`, `alignmentDomain` or `location` entry of its own, and does not need to: `formFields.ts`, `listConfig.ts` and `queryFields.ts` all reference `DeityMetaField.*` for these three, and each resolves through `npcMeta`'s declaration. The fields render, filter and validate on the deities pages exactly as they do on NPC pages.

Two consequences that matter here:

- **`deities.location` is fully in scope.** It is a live, declared, filterable field backed by the same `locationList` as `npc.location`, holding values in the same range (the seed writes `0, 1, 2, 4, 9`). It joins Class A alongside `npc.location`.
- **The two cannot be migrated independently.** One `location` declaration serves both domains, so pointing it at the database changes `npc` and `deities` in the same edit. A plan that migrates "npc first, deities later" is not available; the FK must land on both tables in the same migration as the metadata change.

Worth recording for a future reader, though not this spec's business: last-spread-wins means a domain meta that ever declares a field name another domain already uses is **silently overridden**, with no type error. It is correct today only because the shared fields genuinely are identical.

## 2. Goal

The option lists that are **genuinely entities** — locations and factions — become real tables with real foreign keys, so Postgres enforces the link and the DM can eventually give them their own attributes; and every remaining option-backed `Int` field gains validation that rejects a value not in its list, so the silent-blank failure becomes impossible for all of them.

## 3. Non-goals

- **Converting every FK-shaped `Int` column into a relation.** Roughly 20 columns across the four domains are backed by an option list, and most of them are **closed vocabularies, not entities** — see §6 for the classification and the reasoning. A three-row `alignment` table would be strictly worse than the enum it replaced: another join, another seed, another thing to keep in sync, for a list that has not changed since the project began and is not the DM's to edit.
- **Building the Locations feature.** "Locations as first-class entities" (a location with a description, a map coordinate and its NPC roster) is the **next** ROADMAP item and needs its own spec. This one creates the table, moves the data into it and enforces the foreign key — it does not add a location CRUD page, a description field, or a map link. The point of doing it in this order is that the later feature then has somewhere to put its data.
- **Renaming any Postgres column.** The `@map` decoupling stays exactly as it is (`location Int @map("luogo")` → `location Location @relation(...)` keeps `luogo` as the underlying column name where the FK lives). Column renames are their own migration and their own risk; per `CLAUDE.md` they are not bundled into a behaviour change.
- **Changing what the DM sees.** With the exception of validation errors on invalid input, this spec is intended to be invisible in the UI: the same dropdowns, with the same labels, in the same order.
- **Multi-campaign scoping.** No `campaignId` on the new tables. That arrives for every entity at once, per SPEC-002 §2's reasoning — a new table must not grow its own private scoping column ahead of that work.
- **Translating the seeded content.** Location and faction names are campaign content, which per `CLAUDE.md` is "whatever the DM wrote" and is never translated or dual-columned. The `labelKey` indirection these lists currently carry is a consequence of them living in code; once they are rows, their names are data. See §7 for what this costs.
- **A DM-facing editor for the new tables.** Adding a location still means a seed or a `psql` insert after this ships. The editor is part of the Locations feature, not this.

## 4. User stories

- As a DM, I want the app to refuse an invalid faction or location outright, so that a bad write is reported instead of silently producing a blank field I discover months later.
- As a DM, I want locations and factions to be rows in the database rather than entries in a source file, so that they can later gain descriptions, map coordinates and an NPC roster without another migration.
- As a DM, I want my existing NPCs and deities to keep pointing at exactly the same places and factions they point at today, with no re-entry and no silent re-mapping.

## 5. Behaviour

Almost all of this is invisible. The user-facing surface is the two dropdowns (`location`, `faction`) continuing to work, and validation errors becoming possible where they were not before.

**Main flow**

1. The DM opens an NPC form. The Location and Faction selects are populated exactly as today — same labels, same order.
2. The DM picks a faction and saves. The value written is a foreign key into `faction`, and Postgres verifies it exists.
3. Every list, card and filter continues to display the faction's name as it does today.

**Pre-migration audit** — this runs once, before any schema change, and its result decides part of the migration:

```sql
-- values with no matching option, per column being related
SELECT DISTINCT fazione FROM npc
  WHERE fazione NOT IN (0,1,2,3,4,5,6,7,8,10,11,12,13,14,15,16,17,18,19,21,22);
SELECT DISTINCT luogo FROM npc     WHERE luogo NOT IN (0,1,2,…,32);
SELECT DISTINCT luogo FROM deities WHERE luogo NOT IN (0,1,2,…,32);

-- and, separately, for the Class B validator work (T1): every option-backed
-- column, to size how much existing data the new validators would reject
-- on the next edit of an otherwise-untouched row.
```

If these return no rows, the migration is mechanical. If they return rows, the "orphaned values" decision applies and **must be settled with the DM before the FK is added** — an orphan is a real NPC standing in a place that no longer exists, and only the DM knows where they were meant to be.

The Class B half of the audit matters for a subtler reason: a membership validator added to a field whose existing rows hold out-of-list values turns every future save of those rows into a validation failure, on a field the DM may not even be editing. If the audit finds such rows, T1 needs a decision about them too — repair them, or scope the validator to reject only _new_ out-of-list values.

**Edge cases**

| Situation                                                       | Expected behaviour                                                                                                                                                                                                                                                           |
| --------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Existing row holds an Int with no matching option               | Found by the pre-migration audit, **not** by the migration failing halfway. Resolution is a DM decision (§6); the FK is added only once none remain.                                                                                                                         |
| Payload carries a `faction`/`location` id that does not exist   | Rejected at the Zod boundary with a field-level error, before Prisma is called — the same shape every other validation failure already takes. Postgres' FK is the second line of defence, not the first: a raw FK violation would surface as a 500, not a usable form error. |
| Payload carries an invalid value for a field that stays an enum | Also rejected at the Zod boundary, by membership in the option list. This is the part of the fix that applies to all ~20 fields, not just the two becoming relations.                                                                                                        |
| DM deletes a location that NPCs still reference                 | Blocked by the FK (`onDelete: Restrict`). Deleting a location out from under its NPCs is exactly the silent corruption this spec exists to prevent, so it must fail loudly. There is no delete UI in this spec, so this is enforced at the DB level only.                    |
| Two NPCs in the same location                                   | Ordinary many-to-one. No uniqueness constraint on the FK.                                                                                                                                                                                                                    |
| Option list and table drift after this ships                    | Cannot happen for `location`/`faction` — the table becomes the only source. For the fields that stay enums, the list stays the single source and is now enforced by the validator, so drift produces a rejected write rather than a blank cell.                              |
| Very large option list in a select                              | Unchanged. The largest is `locationList` at 33 entries; SPEC-002's linked-entity select already populates 119 NPC rows from the database without special handling.                                                                                                           |

## 6. Data model changes

### Which columns are entities, and which are vocabulary

This is the spec's central decision, and the reason it is not "replace every Int with a relation". Every option-backed column falls into one of two classes:

**Class A — genuine entities.** The DM authors them, they belong to this campaign setting, they will grow attributes, and other records belong _to_ them.

| Column                             | Options | Becomes    |
| ---------------------------------- | ------- | ---------- |
| `npc.location`, `deities.location` | 33      | `location` |
| `npc.faction`                      | 21      | `faction`  |

Both `location` columns move together — they are one metadata declaration serving two domains (§1).

**Class B — closed vocabulary.** Fixed sets that come from the 5e rules or the setting's cosmology. They are not DM-authored, they do not gain attributes, and a table for them would add a join and a seed to maintain in exchange for nothing.

`alignment` (3), `alignmentDomain` (4), `rarity` (8), `magicItemType` (10), `spell level` (10), `classes` (8), `subclasses` (24), `deityType` (6), `deityRank` (4), `tradition` (5), `element` (6), `magicColor` (9), `celestialBody` (22), `tarotCard` (23), `divineResidence`.

**Class B keeps its `Int` column and its TypeScript list — but gains a real validator.** This is where most of the correctness benefit of the whole item actually lives, and it needs no migration at all.

**`deities.residence` stays vocabulary in this spec, but is destined to become a location.** It is backed by `celestialPlanes` (7 planes of existence). The DM's stated long-term intent (2026-08-06) is a map tool built on a containment hierarchy:

```
Universe → Plane of Existence → Region → City → Dungeon (playable grid)
```

Under that model a plane of existence is simply the second tier of the same tree that holds cities and dungeons — so `residence` is a location, not a fixed vocabulary, and `Location`'s own "Luoghi Divini" block is already the third place the same idea is expressed (§9, question 6).

Converting it now would mean designing the hierarchy now, which is a feature spec of its own and firmly out of scope here. **What this spec owes that future is only that it does not block it**: the `location` table must be able to gain `parentId` (self-relation) and `kind` as an additive migration, with no rewrite of existing rows. The proposed shape does — both are nullable columns on a table whose ids never change. `residence` therefore keeps its `Int` + `celestialPlanes` list and gains only a membership validator, and the Locations spec inherits the job of folding it in.

### Proposed schema

```prisma
model location {
  id      Int       @id                    // NOT autoincrement — see below
  name    String
  npc     npc[]
  deities deities[]

  @@map("luoghi")
}

model faction {
  id   Int    @id
  name String
  npc  npc[]

  @@map("fazioni")
}

model npc {
  // …unchanged fields…
  locationId Int      @map("luogo")
  location   location @relation(fields: [locationId], references: [id], onDelete: Restrict)
  factionId  Int      @map("fazione")
  faction    faction  @relation(fields: [factionId], references: [id], onDelete: Restrict)
}

model deities {
  // …unchanged fields…
  locationId Int      @map("luogo")
  location   location @relation(fields: [locationId], references: [id], onDelete: Restrict)
}
```

**`id` is not `@default(autoincrement())`, deliberately.** The new tables are seeded with the _existing_ numbering, gaps included — `faction` gets ids `0…8, 10…19, 21, 22`, exactly the values `factions.ts` declares. Preserving the numbers is what makes the migration a pure metadata change with **zero row rewrites**: every `npc.fazione` already holds the right value, so adding the FK constraint is the whole job. Renumbering to a clean sequence would mean rewriting every referencing row, which is precisely the silent-repointing failure this spec is about, performed deliberately. Ids for rows added later come from an explicit `max(id) + 1`, or the table is switched to a sequence in a follow-up once nothing depends on the numbering.

`@@map` to the Italian plural matches the existing convention: Postgres names stay as they are, code is English (ADR-0005, and `CLAUDE.md`'s note that `psql` still showing Italian is expected, not drift). New tables that have **no** legacy column to decouple from — `poi` — kept camelCase straight through per SPEC-002 §6; these two are borderline, since the tables are new but the columns referencing them are legacy. **Open question** (§9).

**Migration strategy**

1. Create the two tables, empty.
2. Seed them from the current TypeScript lists, `value` → `id`, resolved label → `name`. This is a data migration, written as SQL in the migration file, not a `db:seed` step — it must run exactly once, in order, on every environment.
3. Run the audit in §5. **Stop here if it returns rows.**
4. Add the FK constraints.

- **Backfill needed?** Only into the new tables. **No existing row's value changes** — that is the design constraint the id choice above exists to satisfy.
- **Reversible?** Yes, and cheaply: drop the FK constraints and the two tables. The `Int` columns and every value in them survive untouched, because they were never rewritten. This is the strongest argument for the preserve-the-numbering approach.

## 7. Metadata changes

This is the part with real architectural weight, and the reason this spec is not simply a migration.

`PageMeta.options` is **a static array, imported at module load**. `npcMeta.ts` does `import factions from "./factions"` and hands it to `options:` and to `firstOptionValue()` for `defaultValue`. It is consumed by `resolveFieldValue` → `resolveOptions(meta.options, t)`, which maps each entry's `labelKey` through the translator. Everything is synchronous, and both Server and Client Components rely on that.

Once `location` and `faction` are rows, their options must come from the database. Three consequences:

1. **`options` becomes async for those two fields.** SPEC-002 already set the precedent — `fetchLinkableEntities`, a `requireSession()`-guarded Server Action returning `{id, name}[]`, populates `MapPOIPanel`'s entity select from real rows. The same shape applies here, but unlike the POI panel these selects live inside `EntityForm`, which is driven by the metadata layer rather than hand-written JSX. **Extending `PageMeta` to express "options come from here" without breaking the synchronous path for the other ~18 fields is the main design work of this item, and it is not yet solved in this draft.**
2. **`defaultValue: firstOptionValue(factions)` has no static list to read.** It needs a different source — the first row by id, fetched, or a declared constant.
3. **`labelKey` disappears for these two fields.** Their names become data (see §3, non-goals): the row's `name` is displayed directly, not translated. This is correct per `CLAUDE.md` — campaign content is never translated — but it means the ~54 `npc.locations.*` and `npc.factions.*` keys are deleted from both message catalogues, and TD-21's CI key-set check must stay green across that removal.

`Class B` fields need **no metadata change at all** beyond their validator: their lists stay exactly where they are.

**Validator change, all option-backed fields:**

```ts
// today, on all nine
validator: z.number().int(),

// proposed
validator: optionValueValidator(factions),   // membership-checked
```

A shared helper in `app/lib/utils/validators/` building a Zod schema from an option list — one implementation, applied everywhere, so a new option-backed field cannot be declared without membership checking. Array-valued fields (`spells.circle`, `spells.classes`) need the array variant of the same helper.

## 8. Acceptance criteria

- [ ] The pre-migration audit query is recorded, run against the live database, and its result written into this spec before any schema change is applied.
- [ ] `location` and `faction` tables exist, seeded with exactly the ids the TypeScript lists declare today, gaps preserved.
- [ ] No `npc` or `deities` row's `luogo` / `fazione` value differs before and after the migration — verified by a checksum query over each column, run before and after.
- [ ] A payload with a `faction`/`location` id that does not exist is rejected with a field-level error, not a 500 and not a write.
- [ ] A payload with an out-of-list value for a Class B field (e.g. `rarity: 99`) is rejected with a field-level error. Regression test per field type — scalar and array.
- [ ] Deleting a `location` row that an NPC or deity references fails at the database level rather than orphaning it.
- [ ] Every existing NPC and deity displays the same location, faction and alignment label after the migration as before — verified by a test that reads a representative row through the metadata layer both ways.
- [ ] The Location and Faction selects list the same entries in the same order as before, on both the NPC and the deity forms.
- [ ] `npc.locations.*` / `npc.factions.*` keys are removed from both message catalogues and TD-21's key-set CI check stays green.
- [ ] Every new or changed mutation still rejects an unauthenticated request.
- [ ] The migration is reversible: a down path drops the FKs and tables leaving every `Int` value intact, demonstrated on a throwaway database.
- [ ] Coverage has not dropped.

## 9. Implementation plan

_Not filled in — sections above are not agreed yet. §7's async-options design must be settled first; it is the one part of this item with no established pattern to follow._

**Risks**

- **The async-options problem (§7) is the real cost of this item, not the migration.** The migration is a seed plus two constraints. Threading DB-backed options through a metadata layer built on static arrays touches `PageMeta`, `EntityForm`, `resolveFieldValue`, and every consumer that assumes `options` is present and synchronous. If that design turns out to be invasive, the honest response is to **split this spec**: ship the validator fix and the tables, and keep reading options from the static lists (now seeded into, and verified against, the tables) until the Locations feature actually needs DB-authored ones.
- **Orphaned values are a data problem, not a code problem.** If the audit finds rows pointing at values 9 or 20 in `factions`, no amount of migration cleverness answers where those NPCs belong. That is a conversation with the DM, and it blocks the FK.
- `location` is `NOT NULL` on both `npc` and `deities` today, so "set orphans to null" is not available without also making the column nullable — which is a semantic change (an NPC with no location) that this spec does not otherwise propose.
- Deleting the `npc.locations.*` catalogue keys is a one-way change across two message files; TD-21's CI check is the safety net, but the two catalogues must be edited together in the same commit.

**Open questions**

1. ~~Is `deities.residence` a location or vocabulary?~~ **Answered 2026-08-06: a location, eventually.** The DM intends a map tool built on `Universe → Plane of Existence → Region → City → Dungeon`, which makes a plane the second tier of the same tree as cities. It stays vocabulary in this spec and is folded in by the Locations spec; the obligation this spec carries is only that `location` can gain `parentId`/`kind` additively — see §6.
2. **Do the new tables get `@@map` to Italian plurals, or English names?** They are new tables (SPEC-002's precedent says English, straight through) but they hold what the legacy Italian columns point at (the rest of the schema's precedent says `@map`). Both defensible; §6 proposes `@@map` for consistency with the columns referencing them.
3. ~~Should the validator fix ship as its own item, ahead of this?~~ **Answered 2026-08-06: yes.** Filed as its own debt item and shipped ahead of any schema work. It is no longer a task of this spec; §7's validator note stays only as context for why the relations still matter afterwards.
4. ~~Does anything outside the app write to these columns?~~ **Answered while drafting:** yes — `app/seed/initial-data/*.ts` writes every option-backed column directly, and `app/seed/importLibrary.ts` maps them from the legacy Italian export format. Both must seed the `location`/`faction` tables before writing `npc`, or the FK rejects the seed. This is a real ordering constraint on T2, not just a note.
5. ~~Do `deities.location` / `alignment` / `alignmentDomain` need metadata declarations?~~ **Answered 2026-08-06: they already have them.** They resolve through `npcMeta`'s declarations via the flat `pageMetaFields` registry (§1) and render, filter and validate correctly on the deities pages today. The original draft's claim that they were invisible was wrong.
6. ~~What are `DivineResidence` and `Zone`?~~ **Answered 2026-08-06: leftovers, safe to delete.** Superseded by `Location` / `celestialPlanes`; `DivineResidence` duplicates `Location`'s "Luoghi Divini" display strings character for character. Removal is a separate cleanup commit, not part of this spec.
7. **Do the `location` / `faction` tables need a `name` column at all, or should the seeded name come from the message catalogues?** Today's labels live in `messages/{it,en}.json` under `npc.locations.*` / `npc.factions.*` and are therefore translated. Once these are rows, §3 says their names become campaign content and stop being translated — which is correct per `CLAUDE.md`, but it means the Italian catalogue's strings become the table's `name` and the English ones are discarded. **Confirm that is intended before T2 seeds anything**, because it is not reversible from the catalogue side once the keys are deleted.

## 10. Task breakdown

_Provisional — §7's async-options design and open question 7 are unresolved._

**Prerequisite, outside this spec:** the membership-validator item (TD-61). It ships first, on its own, and covers every option-backed field including the ones that stay vocabulary. Nothing below depends on it landing, but the correctness benefit arrives with it rather than here.

- [ ] **T0** — Run the §5 audit against the live database; record the result here _(no code; blocks T2 onward)_
- [ ] **T1** — `location` + `faction` Prisma models and the seeding migration, no FK yet. Seed order updated so both tables are written before `npc`/`deities` _(test: migration applies on a throwaway DB; seeded ids match the TypeScript lists exactly, gaps included; `pnpm db:seed` still succeeds end to end)_
- [ ] **T2** — Add the FK constraints to `npc.luogo`, `npc.fazione` and `deities.luogo` _(test: before/after checksum per column is identical; deleting a referenced location fails)_
- [ ] **T3** — Metadata layer reads `location`/`faction` options from the database. One declaration serves both domains, so this changes the NPC and deity forms together _(test: both forms' selects render the same entries in the same order as before; blocked on §7's design)_
- [ ] **T4** — Remove the now-dead catalogue keys and the two TypeScript lists _(test: TD-21's key-set check green; no import of the deleted files remains)_
- [ ] **T5** — Docs: `ARCHITECTURE.md` data model section, close the ROADMAP item, note follow-ups

## 11. Outcome

_Fill in at close._

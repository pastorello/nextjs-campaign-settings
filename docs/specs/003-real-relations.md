# SPEC-003: Real relations for the entity-shaped Int columns

- **Status:** Draft — not agreed
- **Date:** 2026-08-06
- **Phase:** 3
- **Related:** TD-11 (schema timestamps/indexes; relations were explicitly deferred there), `ROADMAP.md` Phase 3 items "Real relations" and "Locations as first-class entities", [ADR-0003](../adr/0003-metadata-driven-domain-configuration.md), [ADR-0005](../adr/0005-english-identifiers.md), SPEC-002 (precedent for DB-backed select options)

---

## 1. Problem

The DM's world has **places and factions that are real things** — Valleferro, the Circle of Grey Mages, the Temple of the Red Demons. In the app they exist only as labels in a dropdown. The DM cannot open Valleferro and see which NPCs are based there, cannot write a description for it, cannot fix a typo in its name in one place, and cannot add a new location without editing a TypeScript file and redeploying.

Underneath, the connection between an NPC and their faction is **a bare integer that nothing checks**. Three separate observations, all verified in the code today:

- The stored value is an `Int` column (`npc.faction`, `npc.location`, …). Its meaning comes entirely from a `value:` literal in a hand-maintained TypeScript array (`app/lib/config/npc/factions.ts` and friends).
- **Nothing validates membership.** Nine fields across `npcMeta`/`SpellsMeta`/`magicItemMeta` declare `validator: z.number().int()`; the nine option-backed fields in `deityMeta` declare `validator: z.coerce.number()`, which is **weaker still** — it accepts the string `"999"` and the non-integer `5.7` as well. A payload with `faction: 999` passes Zod, and Postgres has no constraint either. The value is written.
- **An unmatched value renders as blank, not as an error.** `getDataLabel` filters the option list for a matching `value` and returns `""` when nothing matches. So a row pointing at a number that no longer exists displays an empty cell — no warning anywhere, in the list, the card, or the form.

Put together: if anyone edits one of those arrays — renumbering entries, or deleting one — every row holding an affected number silently starts showing a blank, or worse, **the label of whatever entry now occupies that number**. There is no error, no migration, and no test that would catch it.

This is not hypothetical. `app/lib/config/npc/factions.ts` runs `0…8, 10…19, 21, 22` — **values 9 and 20 are missing**, which means entries were removed from that list at some point in the past. Whether any `npc` row still holds a `9` or a `20` is unknown and cannot be determined from the code; it needs a query against the live database (see §5, "Pre-migration audit").

### A second finding: three `deities` fields exist in the data but not in the metadata

`deities` has three FK-shaped columns — `luogo` (`location`), `allineamento` (`alignment`), `dominioallineamento` (`alignmentDomain`) — that **have no declaration in `deityMeta.ts`**. `DeityMetaField.location` exists in the enum; nothing in the metadata registry uses it. Since the metadata layer drives form rendering, list columns, filters, query construction _and_ validation from that single declaration, a column absent from it is invisible to the whole app: the DM cannot see, filter or edit these three fields, and no validator ever runs on them.

**They are not dead, and not garbage.** `app/seed/initial-data/deities.ts` populates all three on every seeded deity, with values that resolve cleanly against the existing option lists — `location` holds `0, 1, 2, 4, 9` (all inside `locationList`'s `0…32`), `alignment` holds `0, 1, 2` (exactly the three `alignments` values), `alignmentDomain` holds `0, 1, 2` (inside `alignmentDomains`' four). `app/seed/importLibrary.ts` additionally maps them from the legacy Italian export format (`luogo: "location"`, `allineamento: "alignment"`). The data is intentional and coherent; only the metadata declaration is missing.

So this is **the inverse of dead code**: a field that exists everywhere except the one layer that would make it usable. It is a real drift item in its own right, and it is a prerequisite question for this spec rather than a blocker — see §9, open question 5, for the decision it forces about whether `deities.location` joins Class A.

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
SELECT DISTINCT luogo FROM npc WHERE luogo NOT IN (0,1,2,…,32);

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

| Column         | Options | Becomes    |
| -------------- | ------- | ---------- |
| `npc.location` | 33      | `location` |
| `npc.faction`  | 21      | `faction`  |

`deities.location` belongs here on shape and on data — its seeded values resolve against the same `locationList` — but is held out of the table above pending §9's open question 5, which decides whether its missing metadata declaration is written first. It is expected to join.

**Class B — closed vocabulary.** Fixed sets that come from the 5e rules or the setting's cosmology. They are not DM-authored, they do not gain attributes, and a table for them would add a join and a seed to maintain in exchange for nothing.

`alignment` (3), `alignmentDomain` (4), `rarity` (8), `magicItemType` (10), `spell level` (10), `classes` (8), `subclasses` (24), `deityType` (6), `deityRank` (4), `tradition` (5), `element` (6), `magicColor` (9), `celestialBody` (22), `tarotCard` (23), `divineResidence`.

**Class B keeps its `Int` column and its TypeScript list — but gains a real validator.** This is where most of the correctness benefit of the whole item actually lives, and it needs no migration at all.

`deities.residence` is the one judgement call: it is backed by `celestialPlanes` (7 options) and names a plane of existence, which is arguably a place. It is classed as vocabulary because the seven planes are cosmology — fixed by the setting's design, not locations a DM adds — and nothing will ever be "based at" one the way an NPC is based in a town. It is also the one option-backed `deities` field that _is_ declared in `deityMeta`, so unlike `deities.location` it is at least live. **Flagged as an open question rather than settled.**

### Proposed schema

```prisma
model location {
  id   Int    @id                    // NOT autoincrement — see below
  name String
  npc  npc[]

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

// deities is deliberately untouched — see §1's second finding.
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
- [ ] No `npc` row's `luogo` / `fazione` value differs before and after the migration — verified by a checksum query over both columns, run before and after.
- [ ] `deities` is untouched by this change: no column added, dropped or rewritten.
- [ ] A payload with a `faction`/`location` id that does not exist is rejected with a field-level error, not a 500 and not a write.
- [ ] A payload with an out-of-list value for a Class B field (e.g. `rarity: 99`) is rejected with a field-level error. Regression test per field type — scalar and array.
- [ ] Deleting a `location` row that an NPC references fails at the database level rather than orphaning the NPC.
- [ ] Every existing NPC displays the same location and faction label after the migration as before — verified by a test that reads a representative row through the metadata layer both ways.
- [ ] The Location and Faction selects in the NPC form list the same entries, in the same order, as before.
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

1. **Is `deities.residence` a location or vocabulary?** Classed as vocabulary in §6 on the reasoning that divine planes are cosmology, but the DM's intent decides. If it is a place, it joins Class A and the `location` table gains a `kind` discriminator — a materially bigger change.
2. **Do the new tables get `@@map` to Italian plurals, or English names?** They are new tables (SPEC-002's precedent says English, straight through) but they hold what the legacy Italian columns point at (the rest of the schema's precedent says `@map`). Both defensible; §6 proposes `@@map` for consistency with the columns referencing them.
3. **Should the validator fix ship as its own item, ahead of this?** It needs no migration, fixes the silent-blank failure for all ~20 fields rather than two, and is a fraction of the risk. It is written into this spec as T1 for context, but it stands alone and would deliver most of the correctness benefit immediately. **Recommended.**
4. ~~Does anything outside the app write to these columns?~~ **Answered while drafting:** yes — `app/seed/initial-data/*.ts` writes every option-backed column directly, and `app/seed/importLibrary.ts` maps them from the legacy Italian export format. Both must seed the `location`/`faction` tables before writing `npc`, or the FK rejects the seed. This is a real ordering constraint on T2, not just a note.
5. **Do `deities.location` / `alignment` / `alignmentDomain` get their missing metadata declarations, and does that happen before this spec or inside it?** The evidence (§1) says they are intended fields whose declarations were never written: the seed populates all three with values that resolve correctly against the existing option lists, and the legacy importer maps them. Three ways forward, in increasing scope:

   - **(a) Declare them first, as a separate small item.** Three `PageMeta` entries reusing `locationList`/`alignments`/`alignmentDomains`, which the DM immediately gains as visible, filterable, editable fields. Then `deities.location` joins Class A here on the same footing as `npc.location`. **Recommended** — it is a genuinely small change, it makes the data visible before a constraint is put on it, and it means this spec relates a field the app can actually see.
   - **(b) Relate `deities.location` anyway, leaving it undeclared.** Works technically — the FK constrains the column regardless of whether the metadata layer knows about it — but puts an enforced constraint on data no one can view or correct, which makes any future orphan unfixable through the UI.
   - **(c) Leave `deities` out entirely,** as this draft currently has it. Cheapest, but leaves "relations for the FK-shaped columns" half-done and the metadata gap unrecorded.

   Under (a) or (b), §6's Class A table gains `deities.location`, the `location` model gains a `deities deities[]` back-relation, and §5's audit gains the matching `SELECT DISTINCT luogo FROM deities` query.

6. **`DivineResidence` (12 entries) and `Zone` are imported by nothing.** `DivineResidence` duplicates, character for character, the display strings in `Location`'s "Luoghi Divini" block (`"Paradiso (Sole)"`, `"Elysium (Luna)"`, `"Fiume delle Anime"`, `"Alba dei Tempi"`, …) while `deities.residence` actually reads a third list, `celestialPlanes` (7 planes). So the setting's geography is modelled three times, in three incompatible vocabularies, two of which are unreferenced. Per `CLAUDE.md`'s "unused is not dead" rule this is a question, not a cleanup: are `DivineResidence`/`Zone` scaffolding for something planned, or leftovers? Not this spec's job either way, but it is the strongest argument that a single `location` table is worth having.

## 10. Task breakdown

_Provisional — depends on the open questions above._

- [ ] **T0** — Run the §5 audit against the live database; record the result here _(no code; blocks T3 onward)_
- [ ] **T1** — `optionValueValidator` helper + apply to all option-backed fields, scalar and array _(test: valid value passes, out-of-list value rejected with a field error, per domain; array variant covers `spells.circle`/`classes`)_ — **ships independently of everything below**
- [ ] **T2** — `location` + `faction` Prisma models and the seeding migration, no FK yet _(test: migration applies on a throwaway DB; seeded ids match the TypeScript lists exactly, gaps included)_
- [ ] **T3** — Add the FK constraints _(test: before/after checksum over `luogo`/`fazione` is identical; deleting a referenced location fails)_
- [ ] **T4** — Metadata layer reads `location`/`faction` options from the database _(test: the NPC form's selects render the same entries in the same order as before; blocked on §7's design)_
- [ ] **T5** — Remove the now-dead catalogue keys and the two TypeScript lists _(test: TD-21's key-set check green; no import of the deleted files remains)_
- [ ] **T6** — Docs: `ARCHITECTURE.md` data model section, close the ROADMAP item, note follow-ups

## 11. Outcome

_Fill in at close._

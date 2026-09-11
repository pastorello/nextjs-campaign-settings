# SPEC-018: Game systems — one world, several rule sets

- **Status:** Draft — needs the DM's agreement
- **Date:** 2026-09-11
- **Phase:** 4
- **Related:** [ADR-0003](../adr/0003-metadata-driven-domain-configuration.md), [ADR-0011](../adr/0011-inline-collections-outside-the-metadata-layer.md), [SPEC-012](./012-publishing-and-internet-exposure.md), [SPEC-013](./013-campaign-management.md), [SPEC-001](./001-combat-tracker.md); ADR-0013 to be written (how systems are modelled); Darrington Press Community Gaming License (DPCGL) 2.0; Daggerheart SRD 2.0

---

## 1. Problem

The DM wants to run their setting under Daggerheart, and possibly Pathfinder 2e, not only D&D 5e. For Daggerheart they also want to author original compatible elements (ancestries, communities, classes, subclasses, domain cards, adversaries, environments, items) that they may one day publish.

The app cannot hold any of that. It has no notion of a game system: its game layer simply _is_ 5e. A Daggerheart domain card cannot be stored as a spell: it has a domain instead of classes, a level from 1 to 10 instead of 0 to 9, a recall cost, and no casting time, components or concentration. The same holds, in smaller ways, for things that feel system-free. NPCs and deities carry 5e alignment, and adventures count XP and silver.

Most of the app, though, is already system-free: places, maps, zones, landmarks, factions, search, and the descriptive half of NPCs and deities. That part must stay one — the same world, whichever rules are used to play in it.

## 2. Goal

The app knows which game system each game-layer record belongs to, keeps one shared world across all of them, and supports Daggerheart as the second system after 5e, with Pathfinder 2e designed for and built later.

## 3. Non-goals

- **No fork.** A fork was weighed on 2026-09-11 (this spec's first draft) and rejected: the world is shared across systems and must not be duplicated.
- **No conversion between systems.** A 5e spell does not become a Daggerheart card. Each system's catalogue is authored in its own terms.
- **No seeded rules content, for any system.** The repository is public and stays public. It holds rules _structure_ (tiers, types, fields). Rules _instances_ — a specific SRD class, card, spell, creature, item or table — are data the DM enters. Daggerheart content starts empty.
- **No character sheet or builder.** This is a GM's tool; a player-character layer would be its own spec.
- **No public web publication of homebrew.** Publication, when it comes, is an export into a licence-permitted format (§5), and that export is its own spec.
- **No per-system combat tracker or balance calculator** in this spec.
- **Pathfinder 2e is not built here.** The model must accommodate it; its catalogues get their own slice spec after its licence check (open question 5).

## 4. User stories

- As a DM, I want to choose the system I am working in and see that system's catalogues, while the world (map, places, NPCs, deities, factions) stays the same, so that I do not maintain my setting twice.
- As a DM, I want an NPC's or deity's rules details (a 5e alignment, say) shown for the system in use and hidden otherwise, while the description, appearance and history are shared.
- As a DM, I want each campaign to state its system, so that its adventures count what that system counts — XP or milestones, silver or gold.
- As a DM, I want to author Daggerheart classes, subclasses, domain cards, ancestries, communities, adversaries, environments and equipment, with list pages and filters like every other domain.
- As a DM, I want to attach a Daggerheart environment to a place on my map, so that the world and its encounters live in one tool.
- As a DM, I want to reference an SRD element (hang my homebrew subclass on an SRD class) without the SRD's content being in the repository, and have every record say whether it is homebrew or an SRD reference.

## 5. Behaviour

### Three layers, and the campaign between them

| Layer                                | What                                                                                                                                                                             | System                 |
| ------------------------------------ | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------- |
| **World**                            | Places, maps, zones, landmarks, grids, factions, search                                                                                                                          | Shared                 |
| **Shared entities with rules parts** | NPCs and deities: a shared core (name, description, appearance, holidays, tarot, …) plus a part per system (5e: alignment and alignment domain; Daggerheart: none yet; PF2: tbd) | Core shared, part each |
| **Campaign management** (SPEC-013)   | Campaign → adventure → scene. What an adventure counts depends on its campaign's system                                                                                          | Per campaign           |
| **System catalogues**                | 5e: spells, magic items, treasures. Daggerheart: §6. PF2: later                                                                                                                  | One each               |

### Main flow

1. The dashboard shows a system switch (5e / Daggerheart; PF2 once built). Where the choice is remembered is open question 2.
2. World pages and shared entities are always visible. System catalogues appear only for the active system.
3. A shared entity's form and card show the core fields plus the active system's part.
4. Creating a campaign asks for its system; existing campaigns are 5e.
5. Daggerheart catalogues behave like every existing domain: list with header filters, form, card and delete, all metadata-driven. Ordered features are edited inline, per ADR-0011.

### Edge cases

| Situation                                            | Expected behaviour                                                         |
| ---------------------------------------------------- | -------------------------------------------------------------------------- |
| A deep link to a catalogue of an inactive system     | Decided in T2: switch the active system, or show the page with a notice    |
| An NPC with a 5e alignment, viewed under Daggerheart | The alignment is hidden, never deleted                                     |
| A Daggerheart class given the same domain twice      | Validation error on the second domain                                      |
| Deleting a Daggerheart domain that cards reference   | Refused (`onDelete: Restrict`), as for places today                        |
| A horde adversary without a density                  | Validation error; density is forbidden on every other type                 |
| Cross-entity search                                  | The world plus the active system's catalogues — confirmed in T2 (SPEC-011) |
| Empty state for a new system                         | The same empty-state pattern the existing domains use; nothing is seeded   |

### Licence constraints — binding on every slice

These are readings of the licence texts, not legal advice. Re-check before any publication.

**Daggerheart — DPCGL 2.0** (text last updated 2026-08-05; SRD 2.0 of 2026-08-25). Darrington Press (DRP) can amend the licence at any time (§11), and did in August 2026.

1. **Private play is not Sharing (§1.8).** The app behind login, used by the DM's own group, is private play. SPEC-012's open sign-up would weaken that, so a closed audience is a licence requirement as well as a security one.
2. **The public repo holds mechanics, never content.** See the non-goals. SRD content restructured into tables is Adaptive Content (§1.7), and a web app is not a Permitted Format (§1.9).
3. **Name marks (§2.5).** "Daggerheart" never appears in the app's or the repository's title. Descriptive text says "Daggerheart™ Compatible".
4. **Publication goes only to Permitted Formats:** print and digital print (supplements, cards), or whitelisted VTTs used non-commercially. It needs the attribution of §4.1, plus §4.2 if sold.
5. **Publishing under the DPCGL has a cost (§5).** It releases DRP from infringement claims over similar content, except identical copying. Decide this knowingly before the first export.
6. **Never:** Campaign Frame content (§1.9.3), rulebook text beyond the SRD, or DRP art, maps and logos (§1.5).

**D&D 5e — SRD 5.1**, Creative Commons: the existing rule in [`docs/domain/README.md`](../domain/README.md).

**Pathfinder 2e — not yet checked.** It is believed to be the ORC licence for Remaster material and OGL 1.0a for older material. Verify before its slice (open question 5).

## 6. Data model changes

This is a proposal: ADR-0013 decides, and each slice spec finalises names and constraints.

**The system is a closed vocabulary in code:** `GameSystem = 'dnd5e' | 'daggerheart' | 'pf2e'`. It is not a table, because each value needs code (catalogues, metadata); a system the DM created would have nothing to show.

**Catalogues are one table per system and domain, not one wide table with a `system` column.** A 5e spell and a Daggerheart card share a name and a description and nothing else. One table would be mostly nulls, with a validator per system. The table _is_ the system, and the page declares it (§7). The existing `spells`, `magicitems` and `treasure` tables are the 5e catalogues, unchanged.

**Shared entities: a core plus a part per system.** ADR-0013 chooses between two candidates:

- **(a) One-to-one extension tables**, e.g. `npcDnd5e { npcId, alignment, alignmentDomain }`. Clean per system, one join per read.
- **(b) Nullable columns on the core**, grouped by system in the metadata. No join, but the core grows with every system.

Either way the existing `alignment` and `alignmentDomain` values of NPCs and deities are preserved. (a) copies them into the 5e part in its migration; (b) leaves them where they are. Deities' `class` field is checked in T3 — it may be 5e or setting-specific.

**Campaign:** a `system` column, backfilled to `dnd5e` for existing rows. SPEC-013's counted fields stay as they are for 5e. What a Daggerheart campaign counts (milestones, Battle Points, gold) is decided in its own slice (T8).

**Daggerheart catalogues** — structure only, restated from SRD 2.0:

| Element         | Fields                                                                                                                                                                                                                                                                                                                                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| **Domain**      | Name, description, origin. SRD 2.0 has ten (the core nine plus Dread); they are data the DM enters, not an enum                                                                                                                                                                                                                                                                                                 |
| **Domain card** | Name, domain → Domain, level 1–10, recall cost (Stress, ≥ 0), type (ability / spell / grimoire), feature text                                                                                                                                                                                                                                                                                                   |
| **Class**       | Name, description, two distinct domains, starting Evasion, starting HP, class items (text), Hope feature (name + text; it always costs 3 Hope, so the cost is not stored), class features (ordered, at least one)                                                                                                                                                                                               |
| **Subclass**    | Class → Class, name, description, spellcast trait (nullable; one of the six traits), features tagged foundation / specialization / mastery                                                                                                                                                                                                                                                                      |
| **Ancestry**    | Name, description, exactly two features                                                                                                                                                                                                                                                                                                                                                                         |
| **Community**   | Name, description, characteristic adjectives (optional), one feature; optional links to factions and places                                                                                                                                                                                                                                                                                                     |
| **Adversary**   | Name, tier 1–4, type (bruiser, horde, leader, minion, ranged, skulk, social, solo, standard, support), horde density (creatures per HP, hordes only), description, motives & tactics, Difficulty, Major / Severe thresholds, HP, Stress, attack modifier, standard attack (name, range, damage expression, physical / magic), experiences (name + bonus), features (ordered; action / reaction / passive; text) |
| **Environment** | Name, tier, type (exploration, social, traversal, event), one-line description, impulses, Difficulty, potential adversaries (links + free text), features (ordered; kind, text, optional prompt questions); optional links to places                                                                                                                                                                            |
| **Weapon**      | Name, tier, primary / secondary, trait, range, damage die + flat modifier, physical / magic, burden (1 or 2 hands), optional feature                                                                                                                                                                                                                                                                            |
| **Armor**       | Name, tier, base Major / Severe thresholds, base armor score, optional feature                                                                                                                                                                                                                                                                                                                                  |
| **Loot**        | Name, item / consumable, rarity (common, uncommon, rare, legendary), optional roll value on the DM's own table, effect text                                                                                                                                                                                                                                                                                     |

Every Daggerheart record carries `origin` (`homebrew` | `srdReference`), defaulting to `homebrew`. The future export needs it to state what was modified (§4.1(e)).

Some rules the model follows rather than stores:

- Tier 1 is level 1, tier 2 is levels 2–4, tier 3 is levels 5–7, tier 4 is levels 8–10.
- Gold: 10 handfuls make 1 bag and 10 bags make 1 chest (optionally, 10 coins make 1 handful).

- **Backfill needed?** `campaign.system = 'dnd5e'` for every existing row. With option (a), the NPCs' and deities' alignment values are also copied into the 5e part.
- **Reversible?** Yes. The (a) migration keeps a down path that copies the values back.

## 7. Metadata changes

- **Page config** gains an optional `system`; absent means shared. Navigation and search filter on it. A test asserts that every page is either shared or belongs to exactly one known system.
- **Shared entities' `PageMeta` fields** gain an optional `system`, so the form and the card show only the active system's part.
- **One `app/lib/config/<element>/<element>Meta.ts` per Daggerheart element**, composed into `pageMetaFields.ts` and ordered in `pagesConfig.ts`. Features are the ADR-0011 case: an ordered collection edited inside its parent's page, with no list page of its own. Its scalar fields still declare their `PageMeta`.
- **The layer is string-keyed** (`CLAUDE.md`): a missed key silently stops filtering. Every slice extends the invariants in `pageMetaInvariants.testkit.ts` rather than trusting the compiler.

## 8. Acceptance criteria

- [ ] With only 5e defined, the app behaves exactly as today: every existing unit and e2e test passes unchanged once the system dimension lands
- [ ] Every page is either shared or belongs to exactly one system, and a test enforces it
- [ ] Switching the active system never hides a world page, and always hides the other systems' catalogues
- [ ] No NPC or deity rules value is lost in the migration (tested on a fixture row, not on SRD content)
- [ ] No rules instance of any system is committed — no seed, fixture or test data reproduces an SRD class, card, spell, creature, item or table (checked in review for every slice)
- [ ] Neither the app's title nor the repository's contains "Daggerheart"
- [ ] New UI copy lands in both `messages/it.json` and `messages/en.json`
- [ ] Every new mutation rejects an unauthenticated request
- [ ] Every new mutation rejects invalid input with field-level errors
- [ ] Coverage has not dropped

## 9. Implementation plan

_Filled in per slice; each slice in §10 gets its own spec._

**Risks**

- **Scope.** Three systems multiply every later spec that touches the game layer. Mitigation: model for N systems, build one at a time, and build PF2 only when it is asked for.
- **Navigation.** The dashboard gains about ten Daggerheart pages; the switch is what keeps it readable.
- **The string-keyed metadata layer.** See §7.
- **Licence drift.** The DPCGL and the SRD both changed in August 2026. `docs/domain/daggerheart.md` records the versions it was written against.
- **SPEC-013's "authored values" rule was a consequence of having no system.** The rule, in [`campaign-design-method.md`](../domain/campaign-design-method.md) §6, exists because the method came from PF2 and the app was 5e. Once systems are modelled, counting per system becomes possible. Reversing the rule is a deliberate decision for T8, not something to drift into.

**Open questions**

1. **What "the same campaign on three systems" means.** (a) The world is shared and each campaign picks one system — recommended. (b) One campaign can switch systems, which needs parallel rules data for every adventure and scene.
2. **Where the active system lives:** derived from the current campaign, a user preference, or a URL segment like the locale.
3. **Shared entities:** extension tables or nullable columns (ADR-0013).
4. **Daggerheart features:** one polymorphic `feature` table (owner type + id, like ADR-0009's world tree) or one table per owner. An ADR in T4.
5. **Pathfinder 2e:** the licence check (ORC / OGL), and when.
6. **Daggerheart Battle Points:** computed from the SRD formula, or authored like SPEC-013's numbers?
7. **Publication:** which format first, and free or sold? The answer decides whether §4.2 applies.
8. **Transformations and campaign frames:** SRD 2.0 transformations, and the DM's own setting written as a campaign frame — which slice, if any.

## 10. Task breakdown

- [ ] **T1** — Write ADR-0013 (modelling game systems). Extend `docs/domain/README.md` with the DPCGL rule. Write `docs/domain/daggerheart.md`: the mechanics restated, with the SRD and licence versions. _(check: review)_
- [ ] **T2** — The system dimension, with 5e as the only system: `GameSystem`, the page `system` field, the switch, and `campaign.system` backfilled. No visible change. _(test: page-classification unit test; full e2e green)_
- [ ] **T3** — Move the NPC and deity rules fields into the 5e part, per ADR-0013. _(test: the migration keeps every value)_
- [ ] **T4** — Slice spec: Daggerheart domains, domain cards, classes, subclasses
- [ ] **T5** — Slice spec: ancestries, communities
- [ ] **T6** — Slice spec: adversaries, environments (environment ↔ place)
- [ ] **T7** — Slice spec: weapons, armor, loot
- [ ] **T8** — Slice spec: campaign management for Daggerheart
- [ ] **Later** — PF2 catalogues (after open question 5), export and publication, session tooling

## 11. Outcome

_Fill in at close._

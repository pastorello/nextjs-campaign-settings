# SPEC-018: Game systems — one world, several rule sets

- **Status:** Draft — needs the DM's agreement
- **Date:** 2026-09-11 (first three open questions decided the same day, §9)
- **Phase:** 4
- **Related:** [ADR-0003](../adr/0003-metadata-driven-domain-configuration.md), [ADR-0011](../adr/0011-inline-collections-outside-the-metadata-layer.md), [SPEC-012](./012-publishing-and-internet-exposure.md), [SPEC-013](./013-campaign-management.md), [SPEC-001](./001-combat-tracker.md); ADR-0013 to be written (how systems are modelled); Darrington Press Community Gaming License (DPCGL) 2.0; Daggerheart SRD 2.0

---

## 1. Problem

The DM wants to run their setting under Daggerheart, and possibly Pathfinder 2e, not only D&D 5e. For Daggerheart they also want to author original compatible elements (ancestries, communities, classes, subclasses, domain cards, adversaries, environments, items) that they may one day publish.

The app cannot hold any of that. It has no notion of a game system: its game layer simply _is_ 5e. A Daggerheart domain card cannot be stored as a spell: it has a domain instead of classes, a level from 1 to 10 instead of 0 to 9, a recall cost, and no casting time, components or concentration. The same holds, in smaller ways, for campaign management: adventures count XP and silver, which Daggerheart does not use.

Most of the app, though, is already system-free: places, maps, zones, landmarks, factions, search, NPCs and deities. That part must stay one — the same world, whichever rules are used to play in it.

## 2. Goal

The app knows which game system each game-layer record belongs to, keeps one shared world across all of them, and supports Daggerheart as the second system after 5e, with Pathfinder 2e designed for and built later.

## 3. Non-goals

- **No fork.** A fork was weighed on 2026-09-11 (this spec's first draft) and rejected: the world is shared across systems and must not be duplicated.
- **No conversion between systems.** A 5e spell does not become a Daggerheart card. Each system's catalogue is authored in its own terms.
- **No seeded rules content, for any system.** The repository is public and stays public. It holds rules _structure_ (tiers, types, fields). Rules _instances_ — a specific SRD class, card, spell, creature, item or table — are data the DM enters. Daggerheart content starts empty.
- **No character sheet or builder.** This is a GM's tool; a player-character layer would be its own spec.
- **No public web publication of homebrew.** Publication, when it comes, is an export into a licence-permitted format (§5), and that export is its own spec.
- **No per-system combat tracker or balance calculator** in this spec.
- **Pathfinder 2e is not built here.** The model must accommodate it. Its licence is checked (§5), and its catalogues get their own slice spec when they are wanted.

## 4. User stories

- As a DM, I want to choose the system I am working in and see that system's catalogues, while the world (map, places, NPCs, deities, factions) stays the same, so that I do not maintain my setting twice.
- As a DM, I want the system to be part of the URL, so that a bookmark or a link reopens the setting under the same rules.
- As a DM, I want a deity's alignment visible under every system, so that I can always tell whether a god is evil — even under rules that have no alignment.
- As a DM, I want each campaign to state its system, so that its adventures count what that system counts — XP or milestones, silver or gold.
- As a DM, I want to author Daggerheart classes, subclasses, domain cards, ancestries, communities, adversaries, environments and equipment, with list pages and filters like every other domain.
- As a DM, I want to attach a Daggerheart environment to a place on my map, so that the world and its encounters live in one tool.
- As a DM, I want to reference an SRD element (hang my homebrew subclass on an SRD class) without the SRD's content being in the repository, and have every record say whether it is homebrew or an SRD reference.

## 5. Behaviour

### What is shared, and what belongs to a system

| Layer                              | What                                                                                                             | System                |
| ---------------------------------- | ---------------------------------------------------------------------------------------------------------------- | --------------------- |
| **World**                          | Places, maps, zones, landmarks, grids, factions, search — and NPCs and deities, every field included (see below) | Shared                |
| **Campaign management** (SPEC-013) | Campaign → adventure → scene. Each campaign belongs to one system, and what its adventures count follows from it | One per campaign      |
| **System catalogues**              | 5e: spells, magic items, treasures. Daggerheart: §6. PF2: later                                                  | The system in the URL |

### Compatibility, not correspondence

A setting concept that one system lacks is kept, not hidden. Alignment stays on NPCs and deities under Daggerheart and Pathfinder 2e exactly as under 5e, because it answers a question about the world — is this god evil? — that every table asks, whatever its rules say about it. The systems are made _compatible_ with one world; they are not forced into exact correspondence with each other.

So shared entities have no per-system fields today. If a system ever needs a genuinely mechanical field on a shared entity, where that field goes is decided by an ADR at that point.

### Main flow

1. The active system is a segment of the URL, beside the locale (e.g. `/it/5e/dashboard/spells`; ADR-0013 fixes the exact shape). Spells, deities and the rest of the setting are viewed through a system, not through a campaign, so the system travels with every link and a bookmark reopens the same system. A switch in the dashboard changes it.
2. World pages are visible under every system and show the same data. System catalogues appear only for the system in the URL.
3. NPC and deity forms and cards are identical under every system, alignment included.
4. Creating a campaign asks for its system; existing campaigns are 5e. A campaign opens under its own system's URL.
5. Daggerheart catalogues behave like every existing domain: list with header filters, form, card and delete, all metadata-driven. Ordered features are edited inline, per ADR-0011.

### Edge cases

| Situation                                                            | Expected behaviour                                                       |
| -------------------------------------------------------------------- | ------------------------------------------------------------------------ |
| A URL without a system segment (an old bookmark, a link in the docs) | Redirects to the same page under 5e, the only system before T2           |
| A URL with an unknown system                                         | Not found, as with an unknown locale                                     |
| A campaign opened under another system's URL                         | Redirects to the campaign's own system                                   |
| A Daggerheart class given the same domain twice                      | Validation error on the second domain                                    |
| Deleting a Daggerheart domain that cards reference                   | Refused (`onDelete: Restrict`), as for places today                      |
| A horde adversary without a density                                  | Validation error; density is forbidden on every other type               |
| Cross-entity search                                                  | The world plus the URL system's catalogues — confirmed in T2 (SPEC-011)  |
| Empty state for a new system                                         | The same empty-state pattern the existing domains use; nothing is seeded |

### Licence constraints — binding on every slice

These are readings of the licence texts, not legal advice. Re-check before any publication.

**Daggerheart — DPCGL 2.0** (text last updated 2026-08-05; SRD 2.0 of 2026-08-25). Darrington Press (DRP) can amend the licence at any time (§11), and did in August 2026.

1. **Private play is not Sharing (§1.8).** The app behind login, used by the DM's own group, is private play. SPEC-012's open sign-up would weaken that, so a closed audience is a licence requirement as well as a security one.
2. **The public repo holds mechanics, never content.** See the non-goals. SRD content restructured into tables is Adaptive Content (§1.7), and a web app is not a Permitted Format (§1.9).
3. **Name marks (§2.5).** "Daggerheart" never appears in the app's or the repository's title. Descriptive text says "Daggerheart™ Compatible".
4. **Publication goes only to Permitted Formats:** print and digital print (supplements, cards), or whitelisted VTTs used non-commercially. It needs the attribution of §4.1, plus §4.2 if sold.
5. **Publishing under the DPCGL has a cost (§5).** It releases DRP from infringement claims over similar content, except identical copying. Decide this knowingly before the first export.
6. **Never:** Campaign Frame content (§1.9.3), rulebook text beyond the SRD, or DRP art, maps and logos (§1.5).

**D&D 5e — SRD 5.1 and SRD 5.2.1 under CC-BY-4.0.** Any medium, software included, with an attribution statement if SRD text is ever shipped; the no-seed rule makes that moot. Trademarks are not licensed, so "D&D 5e" may label the system but never name the app.

**Pathfinder 2e — the ORC licence (Remaster) and OGL 1.0a (older books).** Any medium, software included. Rules content in the repo would need an ORC Notice, and would make the DM's game content built on it ORC-licensed too (share-alike); the no-seed rule avoids both. Paizo's setting, deities included, is Reserved Material. "Pathfinder" may label the system, never name the app.

The full analysis for all three systems, with sources and findings on the current repository, is [`docs/domain/licensing.md`](../domain/licensing.md).

## 6. Data model changes

This is a proposal: ADR-0013 decides, and each slice spec finalises names and constraints.

**The system is a closed vocabulary in code:** `GameSystem = 'dnd5e' | 'daggerheart' | 'pf2e'`. It is not a table, because each value needs code (catalogues, metadata); a system the DM created would have nothing to show.

**Catalogues are one table per system and domain, not one wide table with a `system` column.** A 5e spell and a Daggerheart card share a name and a description and nothing else. One table would be mostly nulls, with a validator per system. The table _is_ the system, and the page declares it (§7). The existing `spells`, `magicitems` and `treasure` tables are the 5e catalogues, unchanged.

**Shared entities stay as they are.** NPCs and deities keep every field, alignment included, under every system (§5, "Compatibility, not correspondence"). No migration, no extension tables.

**The active system is not stored.** It lives in the URL. The database records only which system each campaign and each catalogue belongs to.

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

- **Backfill needed?** `campaign.system = 'dnd5e'` for every existing row, and nothing else.
- **Reversible?** Yes, by dropping the column.

## 7. Metadata changes

- **Page config** gains an optional `system`; absent means shared. Navigation and search filter on it. A test asserts that every page is either shared or belongs to exactly one known system.
- **Routing.** A `[system]` segment beside `[locale]`, validated against `GameSystem` the way the locale is validated against the supported locales. Every internal link must carry it. Whether that happens through a wrapper around the navigation helpers or in the routing layer is ADR-0013's decision.
- **One `app/lib/config/<element>/<element>Meta.ts` per Daggerheart element**, composed into `pageMetaFields.ts` and ordered in `pagesConfig.ts`. Features are the ADR-0011 case: an ordered collection edited inside its parent's page, with no list page of its own. Its scalar fields still declare their `PageMeta`.
- **The layer is string-keyed** (`CLAUDE.md`): a missed key silently stops filtering. Every slice extends the invariants in `pageMetaInvariants.testkit.ts` rather than trusting the compiler.

## 8. Acceptance criteria

- [ ] With only 5e defined, the app behaves exactly as today: every existing unit and e2e test passes unchanged once the system dimension lands
- [ ] Every page is either shared or belongs to exactly one system, and a test enforces it
- [ ] Switching the active system never hides a world page, and always hides the other systems' catalogues
- [ ] NPC and deity pages show the same fields, alignment included, under every system
- [ ] A URL without a system segment redirects to its 5e equivalent, and an unknown system is not found
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
- **Routing.** Every dashboard URL gains a segment, so every link, redirect and e2e URL changes, and the compiler checks none of them. T2 lands only with the full e2e suite green, not a single spec.
- **The string-keyed metadata layer.** See §7.
- **Licence drift.** The DPCGL and the SRD both changed in August 2026. `docs/domain/daggerheart.md` records the versions it was written against.
- **SPEC-013's "authored values" rule was a consequence of having no system.** The rule, in [`campaign-design-method.md`](../domain/campaign-design-method.md) §6, exists because the method came from PF2 and the app was 5e. Once systems are modelled, counting per system becomes possible. Reversing the rule is a deliberate decision for T8, not something to drift into.

**Decided on 2026-09-11**

- **The world is shared, and each campaign picks one system.** A campaign does not switch systems.
- **The active system lives in the URL.** Spells, deities and the setting are viewed through a system, not through a campaign, so the system is not derived from the current campaign.
- **Alignment is kept under every system** — compatibility, not correspondence (§5). This retired the question of where per-system fields of shared entities go: there are none.

**Open questions**

1. **The campaign list under a system:** only that system's campaigns (recommended, since a campaign belongs to one), or all of them with a system badge?
2. **The URL's shape and slugs** (`/it/5e/dashboard/…` or `/it/dashboard/5e/…`; `5e`, `pf2e`, `daggerheart`). ADR-0013.
3. **Daggerheart features:** one polymorphic `feature` table (owner type + id, like ADR-0009's world tree) or one table per owner. An ADR in T4.
4. **Pathfinder 2e:** when. Its licence is already checked (§5).
5. **Daggerheart Battle Points:** computed from the SRD formula, or authored like SPEC-013's numbers?
6. **Publication:** which format first, and free or sold? The answer decides whether §4.2 applies.
7. **Transformations and campaign frames:** SRD 2.0 transformations, and the DM's own setting written as a campaign frame — which slice, if any.

## 10. Task breakdown

- [ ] **T1** — Write ADR-0013 (modelling game systems: the URL segment, one table per catalogue, compatibility rather than correspondence). Point `docs/domain/README.md` at the licensing analysis. Write `docs/domain/daggerheart.md`: the mechanics restated, with the SRD and licence versions. _(check: review)_
- [ ] **T2** — The system dimension, with 5e as the only system: `GameSystem`, the `[system]` URL segment with redirects from old URLs, the page `system` field, and the switch. No visible change beyond the URL. _(test: page-classification unit test; redirect tests; full e2e green)_
- [ ] **T3** — `campaign.system`, backfilled to `dnd5e`. Creating a campaign asks for it, and a campaign opens under its own system. _(test: backfill; redirect)_
- [ ] **T4** — Slice spec: Daggerheart domains, domain cards, classes, subclasses
- [ ] **T5** — Slice spec: ancestries, communities
- [ ] **T6** — Slice spec: adversaries, environments (environment ↔ place)
- [ ] **T7** — Slice spec: weapons, armor, loot
- [ ] **T8** — Slice spec: campaign management for Daggerheart
- [ ] **Later** — PF2 catalogues (open question 4), export and publication, session tooling

## 11. Outcome

_Fill in at close._

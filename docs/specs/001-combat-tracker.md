# SPEC-001: Combat tracker

- **Status:** Draft — skeleton, not yet agreed
- **Date:** 2026-07-22
- **Phase:** ROADMAP Phase 4 (Session tooling)
- **Related:** [`docs/domain/5e-combat.md`](../domain/5e-combat.md), ROADMAP "Encounter builder / Initiative tracker"

> **This is a placeholder, captured now so the workflow and the thinking are not
> lost.** It is _not_ ready to build. Sections 1–3 record what we already agreed;
> everything from §5 on is waiting on a domain research pass into
> `docs/domain/5e-combat.md`. Do not implement against this until it reaches
> **Status: Agreed**.

---

## 1. Problem

Running a combat encounter at the table means tracking, by hand, whose turn it
is, the initiative order, each combatant's remaining HP and conditions, and
rolling dice separately. A DM already managing NPCs and spells in this app has to
leave it and use paper or a second tool for the one part of a session that is
most real-time.

## 2. Goal

A DM can run a combat encounter inside the app: set initiative, step through
turns in order, track HP and conditions per combatant, and roll dice without
leaving the page.

## 3. Non-goals

Kept deliberately tight so this stays a tracker, not a rules engine:

- **Not** a spell/attack resolution engine — it does not know what "Fireball"
  does; the DM applies effects manually.
- **Not** automated rules enforcement beyond the action economy — no legality
  checks on what a combatant may do.
- **Not** encounter _balancing_ (CR budgets) — that is a separate future feature.
- **Not** multiplayer / real-time sync — single DM, single screen (consistent
  with the app's current single-user model).
- **Not** persistence of combat history, at least in v1 — an encounter is
  ephemeral unless a later spec says otherwise.

## 4. User stories

- As a DM, I want to add combatants (NPCs from the app, plus ad-hoc ones) and
  roll initiative, so that turn order is set without paper.
- As a DM, I want to advance to the next turn and see whose it is, so that I
  never lose my place mid-fight.
- As a DM, I want to adjust a combatant's HP and toggle conditions quickly, so
  that the tracker reflects the table in real time.
- As a DM, I want to roll `NdM+mod` (with advantage/disadvantage), so that I do
  not reach for physical dice.

## 5. Behaviour

_Pending the domain pass. Fill the turn flow and edge cases (empty initiative,
tie handling, a combatant dropping to 0 HP, removing a combatant mid-round) once
`docs/domain/5e-combat.md` §2–§4 exist._

## 6. Data model changes

_Open question — see §9. A combat may be ephemeral (client state only) or a
persisted `Encounter` model. This decides whether TD-11's schema work is a
prerequisite. Do not assume; decide before planning._

## 7. Metadata changes

_TBD. Combatant fields (initiative, HP, conditions) may or may not fit the
existing `PageMeta` system — the tracker is more interactive than the CRUD pages
the metadata layer was built for. Assess against ADR-0003 during planning._

## 8. Acceptance criteria

_TBD from §5. The standing ones still apply:_

- [ ] Any mutation rejects an unauthenticated request (TD-01 pattern)
- [ ] Any mutation rejects invalid input with field-level errors (TD-02 pattern)
- [ ] The dice roller is a pure, unit-tested function
- [ ] Coverage has not dropped

## 9. Implementation plan

_Not started. Do not fill until §5–§8 are agreed._

**Open questions to resolve first**

- **Ephemeral vs persisted encounter?** Decides whether this needs a schema
  change (and therefore TD-11) or is client-only state.
- **Does the metadata layer fit an interactive tracker,** or is this the first
  feature that legitimately lives outside it (like `app/modules/maps/`)?
- **Combatants: only app NPCs, or ad-hoc entries too?** Affects the data model.

## 10. Task breakdown

_TBD after the plan. The dice roller (§5) is the natural first task: it is a pure
function, testable in isolation, and needed by everything else._

## 11. Outcome

_Fill in at close._

# ADR-0011: Keep ordered inline collections outside the metadata layer

- **Status:** Accepted — agreed with the DM 2026-08-18, before any implementation
- **Date:** 2026-08-18
- **Deciders:** the maintainer (DM), with Claude Code
- **Related:** decides [SPEC-013](../specs/013-campaign-management.md) §7 (its T1); builds on [ADR-0003](./0003-metadata-driven-domain-configuration.md) (the metadata layer itself) and [ADR-0007](./0007-message-key-resolution-boundary.md); qualifies `CLAUDE.md`'s "never bypass the metadata layer"; TD-08 (the `PageMeta` discriminated union), TD-09 (the quartets collapsed against that layer)

## Context

The metadata layer is this project's one hard-won abstraction. A domain field is declared once, as a `PageMeta` object in `app/lib/config/<domain>/`, and that single declaration drives four separate things: the control in the form, the column in the list, the header filter, and the `where` clause `getQuery.ts` hands to Prisma. That is the whole payoff — add a field in one place and the four stay consistent, which is why `CLAUDE.md` forbids writing a field by hand into a component. A hand-written field works in the form and is silently absent from the filter, and nothing fails to compile.

The abstraction rests on an assumption that has held for all six existing domains and is visible in the type itself. `PageMeta` is a discriminated union on `fieldType` with exactly four variants — `integer`, `string`, `boolean`, `array` — and `array` means an array of scalars (an incantesimo's classes), not of records. **No variant's value is a collection of rows.** Every domain in the app is one flat record per form: a spell, a magic item, an NPC, a deity, a faction, a place.

SPEC-013 introduces a shape the app has never had. An adventure contains an ordered list of scenes; each scene contains two more ordered lists, its creatures and its loot. Three levels. And they are edited in place, inside the parent's page — insert a scene in the middle, drag one up, add a monster to the seventh, tick a checkbox — because §5's whole flow is the DM working down the adventure at the table without navigating away.

`EntityForm` has never rendered anything of the sort, and the four consumers of a `PageMeta` do not all have an answer for a nested collection: the form does, but there is no list column for a scene's creatures, no header filter over them, and no Prisma `where` clause built from them.

The decision matters beyond SPEC-013 because of what it licenses. Building a bespoke editor is exactly the thing `CLAUDE.md` tells an agent not to do, so it cannot be a choice an implementation task makes quietly in passing — either it is a recorded exception with a stated boundary, or the rule stops meaning anything the first time it is inconvenient.

The constraints that shape the answer: a solo maintainer, an abstraction whose value is proven (TD-08 typed it, TD-09 collapsed four component quartets against it and found six defects doing so), and exactly one caller asking for the new shape today.

## Decision

**We will keep ordered, inline-edited collections outside the metadata layer.** SPEC-013's `scene`, `sceneCreature` and `loot` are rendered and edited by dedicated components under `app/ui/campaigns/`. `PageMeta` gains no collection variant.

Every **scalar field** on those rows still declares its `PageMeta` — validator and message key included. The bespoke editor consumes those declarations; it does not restate them.

The boundary, stated so a future session can check a case against it rather than re-argue it:

- **Inside the metadata layer** — a domain that is one flat record, has a list page of its own, a form, and header filters. The six existing domains, plus SPEC-013's `campaign`, `adventure` and the `treasure` catalogue.
- **Outside it** — a collection of rows that exists only within a parent's page, has no list page, no header filter, and no query built from a filter form.
- **Shared either way** — the Zod validator and the label key for every scalar field. A bespoke editor may not invent its own validation.

## Alternatives considered

### Extend `PageMeta` with a collection field type

The serious alternative, and the one that keeps the project's stated principle intact: one way to declare a field, nested rows included, with validation and labels automatically in the same place as everything else. A second nested domain would then cost nothing.

Rejected on the arithmetic of what it buys against what it costs. `PageMeta` is read by roughly fifty call sites, and a fifth variant obliges every consumer to answer "what does a collection mean here?". For three of the four — list column, header filter, query builder — the honest answer is "nothing", so each would carry a not-applicable branch. That is precisely the shape TD-08 removed: before it, `fieldType: array` with `validator: z.string()` type-checked happily, and the point of making the union discriminated was that a variant's obligations cannot disagree with its declaration. Adding a variant three consumers must special-case as inapplicable reintroduces unenforced state into the type that exists to prevent it.

And it would be built for exactly one caller. If a second arrives, the arithmetic changes — which is the revisit condition below, not a reason to pre-empt it now.

### Make `scene` an ordinary flat domain with its own list page

Genuinely tempting, and it fits the metadata layer with zero change: `scene` becomes a seventh domain, `adventureId` an option-backed field, and it is created and edited from its own list page exactly like an NPC.

Rejected on the behaviour SPEC-013 exists to deliver. The budget totals, the reordering and the check-offs all live at the adventure, and §5's flow is the DM working down the scenes mid-session; a separate list page turns every tick into a page navigation away from the thing being read. It also only defers the problem by one tier — creatures and loot sit a level below scenes and would need the same answer again.

### Store the scenes as a JSON column on `adventure`

Rejected quickly, and recorded because it is the shortcut that will look attractive to someone under time pressure. It gives up referential integrity to `zone`, `npc`, `magicitems` and `treasure` — all four of which SPEC-013's links depend on — along with any ability to query or partially update. This app has already made this exact move in the opposite direction: SPEC-002 pulled map POIs out of `localStorage` blobs into real tables precisely to gain those things.

## Consequences

**Positive**

- The metadata layer keeps describing only what it can actually drive end to end. Its claim stays true, which is what makes it trustworthy.
- No generalisation built for a single caller, and no not-applicable branches spread across fifty call sites.
- The scene editor can be exactly what §5 describes rather than what a generic renderer can express.

**Negative**

- **There are now two ways to build an editing surface in this app.** That is the real cost, and it is paid by whoever adds the next domain and has to know which one they are in. The boundary above is the mitigation and it only works if it is read.
- `CLAUDE.md`'s blanket instruction — never bypass the metadata layer, extend it instead — now has an exception, and an unqualified rule with a silent exception is worse than a qualified one. Follow-up work below.
- Per-row validation becomes a discipline rather than a mechanism: nothing in the compiler forces the bespoke editor to use a field's declared validator. The exposure is bounded — every mutation validates server-side regardless (`CLAUDE.md` rule 2), so a bypassed client validator is a UX regression, not a security one — but it is a real way for the two to drift.

**Neutral / follow-up work**

- `CLAUDE.md` and `docs/ARCHITECTURE.md` each get the boundary in a line or two, pointing here. Without that, the next session reads the rule and this ADR as a contradiction.
- SPEC-013 T4 and T8 are unblocked by this.

## Revisit when

**A second domain needs ordered inline collections.** One caller does not justify extending `PageMeta`; two probably do, and the arrival of the second is the concrete trigger — not a general sense that the bespoke editor has grown large. SPEC-014 (the campaign calendar: dated events belonging to a campaign, ordered, edited together) is the likeliest candidate, so the question gets asked then rather than never.

Also revisit if the scene editor's per-row fields start drifting from their `PageMeta` declarations — a label or a validator restated by hand in a component. That is evidence the shared half of the boundary is not holding, and if it is not holding, the reason for choosing this option over the first alternative is weaker than it looked.

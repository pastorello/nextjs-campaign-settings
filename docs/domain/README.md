# Domain reference

Distilled game rules the code is built against — turn structure, dice mechanics,
conditions. This is the **logic**, written in the team's own words, not a copy of
any rulebook.

## Where this comes from, and the one hard rule

The workflow is: read the sources elsewhere (a Cowork/Chat session can read the
PDFs), distil the **mechanics** into a file here, commit that. The distilled file
is the bridge — a Claude Code session cannot read a claude.ai Project's
knowledge, so anything an agent must build against has to live in the repo as a
file.

**Game mechanics are not copyrightable; rulebook text is.** A rule like "on your
turn you roll initiative, then take one action, one bonus action and your
movement" is a functional system and free to restate. The prose of a manual is
not. So:

- ✅ Restate the mechanics in your own words: the turn state machine, an
  `NdM+mod` roll, the initiative order, condition effects.
- ❌ Do not paste rulebook paragraphs, and do not commit the PDFs.
- ✅ Restate from each system's openly licensed source, never from its
  rulebook:
  - **D&D 5e** — the **SRD 5.1** and **SRD 5.2.1**, under **CC-BY-4.0**.
  - **Pathfinder 2e** — the Remaster's rules under the **ORC licence** (older
    books under OGL 1.0a).
  - **Daggerheart** — the **SRD 2.0** under the **Darrington Press Community
    Gaming License (DPCGL)**, which DRP can amend at any time.
- ❌ Whatever the licence allows, **no instances**: no SRD spell, card, class,
  creature, item or table in the repo, for any of the three systems — only the
  structure they share. Instances are data the DM enters in the private
  database.

The three licences differ in what the repo may hold and what the app may ever
publish. [`licensing.md`](./licensing.md) is the reading, and its §7 lists the
rules every spec inherits; re-read it before touching a new system's rules.
Each system file records the SRD and licence versions it was restated from, so
a later version can be re-checked against it.

If a file here starts reading like transcription rather than a mechanics
summary, it has crossed the line — rewrite it as rules, not text.

## Relationship to specs

`docs/domain/` is the _reference_ (how the game works). `docs/specs/` is the
_feature_ (what we are building and why). A spec cites the domain files it
depends on; the domain files describe no product decisions.

## Files

| File                                                       | Covers                                                                                                                                                            |
| ---------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [`5e-combat.md`](./5e-combat.md)                           | Turn structure, initiative, action economy, dice — _stub, to be filled from a research pass_                                                                      |
| [`campaign-design-method.md`](./campaign-design-method.md) | How the DM designs and runs a campaign: adventures per level, scene kinds, pacing budgets, what is system-specific                                                |
| [`daggerheart.md`](./daggerheart.md)                       | Daggerheart's mechanics — Duality Dice, Hope and Fear, tiers and levels, thresholds, Battle Points, gold — restated from SRD 2.0, with the SRD and DPCGL versions |
| [`licensing.md`](./licensing.md)                           | What the SRD/CC-BY (5e), ORC and Paizo policies (PF2) and the DPCGL (Daggerheart) allow the app to hold, ship and publish                                         |

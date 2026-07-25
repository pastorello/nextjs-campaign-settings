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
- ✅ Prefer the **SRD 5.1** (System Reference Document), which Wizards of the
  Coast releases under Creative Commons for exactly this reuse. It is the clean
  source for the base mechanics.

If a file here starts reading like transcription rather than a mechanics
summary, it has crossed the line — rewrite it as rules, not text.

## Relationship to specs

`docs/domain/` is the _reference_ (how the game works). `docs/specs/` is the
_feature_ (what we are building and why). A spec cites the domain files it
depends on; the domain files describe no product decisions.

## Files

| File                             | Covers                                                                                       |
| -------------------------------- | -------------------------------------------------------------------------------------------- |
| [`5e-combat.md`](./5e-combat.md) | Turn structure, initiative, action economy, dice — _stub, to be filled from a research pass_ |

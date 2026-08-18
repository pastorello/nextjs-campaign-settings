/**
 * A campaign: the top-level container for a ladder of adventures
 * (SPEC-013 §6). `createdAt`/`updatedAt` are omitted, matching the
 * established domain-interface convention (`Deity`, `NpcItem`, `MagicItem`,
 * `Spell` all do the same despite their tables carrying both columns) —
 * bookkeeping timestamps aren't a metadata-layer field.
 */
interface Campaign {
  id: number;
  title: string;
  synopsis: string | null;
  partySize: number;
}

export default Campaign;

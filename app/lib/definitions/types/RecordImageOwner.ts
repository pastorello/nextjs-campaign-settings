/**
 * Which record an image belongs to (SPEC-020 T3): the relation name on
 * `recordImage` for the owning table, and the owner's id when it already
 * exists. A create has no id yet, so any record already carrying the image
 * counts as "in use elsewhere". SPEC-021's Daggerheart domain joins this
 * union when its table lands.
 */
type RecordImageOwner = {
  relation: "npc" | "deity" | "magicItem" | "treasure" | "faction" | "zone";
  id?: number;
};

export default RecordImageOwner;

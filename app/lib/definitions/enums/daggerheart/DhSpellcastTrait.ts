/**
 * The trait a subclass casts with (SPEC-021 §5), stored as
 * `dhSubclass.spellcastTrait`; `null` there means the subclass does not cast.
 */
enum DhSpellcastTrait {
  Agility = "agility",
  Strength = "strength",
  Finesse = "finesse",
  Instinct = "instinct",
  Presence = "presence",
  Knowledge = "knowledge",
}

export default DhSpellcastTrait;

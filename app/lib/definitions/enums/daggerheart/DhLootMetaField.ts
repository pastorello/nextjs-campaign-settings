/**
 * A piece of Daggerheart loot's fields (SPEC-029). Kind and rarity are
 * prefixed: magic items own `rarity` and `consumable`.
 */
enum DhLootMetaField {
  name = "name",
  imageId = "imageId",
  kind = "lootKind",
  rarity = "lootRarity",
  rollValue = "rollValue",
  effectText = "effectText",
  origin = "origin",
}

export default DhLootMetaField;

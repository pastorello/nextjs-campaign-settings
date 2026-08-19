/**
 * `loot`'s form-facing fields (SPEC-013 T6). `taken` is deliberately
 * absent — set only by the dedicated check-off action, same reasoning as
 * `SceneMetaField`. `magicItemId` and `treasureId` are both declared here
 * (each a plain nullable FK); their mutual exclusion is a cross-field rule
 * enforced by `createLoot`/`updateLoot`'s schema, not by either field's own
 * validator.
 */
enum LootMetaField {
  position = "position",
  description = "description",
  quantity = "quantity",
  value = "value",
  magicItemId = "magicItemId",
  treasureId = "treasureId",
}

export default LootMetaField;

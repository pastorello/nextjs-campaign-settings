/**
 * `sceneCreature`'s form-facing fields (SPEC-013 T6). `awarded` is
 * deliberately absent — set only by the dedicated check-off action, same
 * reasoning as `SceneMetaField`.
 */
enum SceneCreatureMetaField {
  position = "position",
  name = "name",
  level = "level",
  xpEach = "xpEach",
  quantity = "quantity",
  note = "note",
  npcId = "npcId",
}

export default SceneCreatureMetaField;

/**
 * `scene`'s form-facing fields (SPEC-013 T6). `awarded` is deliberately
 * absent — it is set only by the dedicated check-off action, never through
 * the create/update form, the same reason `NpcMetaField` omits `zoneId`
 * (assigned through its own action, not `NpcForm`).
 */
enum SceneMetaField {
  position = "position",
  kind = "kind",
  title = "title",
  description = "description",
  xpAward = "xpAward",
  grantsHeroPoint = "grantsHeroPoint",
  zoneId = "zoneId",
}

export default SceneMetaField;

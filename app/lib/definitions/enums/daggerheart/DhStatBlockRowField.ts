/**
 * The fields of a stat block's ordered rows (SPEC-028 §6): an adversary's
 * experiences and features, an environment's features. Keys into their
 * metas, outside the metadata layer's registry (ADR-0011).
 */
enum DhStatBlockRowField {
  position = "position",
  name = "name",
  bonus = "bonus",
  kind = "kind",
  fear = "fear",
  text = "text",
  questions = "questions",
}

export default DhStatBlockRowField;

/**
 * A Daggerheart subclass's fields (SPEC-021 §5.5) — keys into
 * `pageMetaFields`. `name`, `description` and `origin` are shared
 * declarations. Its tiered features are an inline ordered collection
 * (ADR-0011), declared in `dhSubclassFeatureMeta`.
 */
enum DhSubclassMetaField {
  name = "name",
  description = "description",
  classId = "classId",
  spellcastTrait = "spellcastTrait",
  origin = "origin",
}

export default DhSubclassMetaField;

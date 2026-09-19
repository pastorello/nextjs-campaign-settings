/**
 * A Daggerheart class's fields (SPEC-021 §5.4) — keys into `pageMetaFields`.
 * `name`, `description` and `origin` are shared declarations; the rest are
 * `dhClassMeta`'s own. The class's features are not here: they are an
 * inline ordered collection (ADR-0011), declared in `dhClassFeatureMeta`.
 */
enum DhClassMetaField {
  name = "name",
  description = "description",
  domainAId = "domainAId",
  domainBId = "domainBId",
  startingEvasion = "startingEvasion",
  startingHp = "startingHp",
  classItems = "classItems",
  hopeFeatureName = "hopeFeatureName",
  hopeFeatureText = "hopeFeatureText",
  origin = "origin",
}

export default DhClassMetaField;

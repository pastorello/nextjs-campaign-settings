/**
 * A class or subclass feature's own fields (SPEC-021 §6) — keys into
 * `dhClassFeatureMeta` / `dhSubclassFeatureMeta`, outside the metadata
 * layer's registry (ADR-0011). `tier` exists only on a subclass's features.
 */
enum DhFeatureMetaField {
  position = "position",
  name = "name",
  text = "text",
  tier = "tier",
}

export default DhFeatureMetaField;

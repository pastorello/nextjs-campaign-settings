/**
 * A Daggerheart armor's fields (SPEC-029). The thresholds are prefixed: an
 * adversary's are a different number on a different thing (SPEC-029 §7).
 */
enum DhArmorMetaField {
  name = "name",
  imageId = "imageId",
  tier = "tier",
  major = "armorMajor",
  severe = "armorSevere",
  armorScore = "armorScore",
  featureName = "armorFeatureName",
  featureText = "armorFeatureText",
  origin = "origin",
}

export default DhArmorMetaField;

/**
 * A Daggerheart ancestry's fields (SPEC-027). The two features are
 * prefixed: `featureText` is already a domain card's key in the flat
 * metadata namespace.
 */
enum DhAncestryMetaField {
  name = "name",
  description = "description",
  imageId = "imageId",
  featureAName = "ancestryFeatureAName",
  featureAText = "ancestryFeatureAText",
  featureBName = "ancestryFeatureBName",
  featureBText = "ancestryFeatureBText",
  origin = "origin",
}

export default DhAncestryMetaField;

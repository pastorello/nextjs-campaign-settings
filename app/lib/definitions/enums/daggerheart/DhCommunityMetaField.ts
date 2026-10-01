/**
 * A Daggerheart community's fields (SPEC-027). Prefixed where a bare name
 * would collide in the flat metadata namespace: a domain card's
 * `featureText`, and the place and faction links other records may carry.
 */
enum DhCommunityMetaField {
  name = "name",
  description = "description",
  imageId = "imageId",
  adjectives = "adjectives",
  featureName = "communityFeatureName",
  featureText = "communityFeatureText",
  placeIds = "communityPlaceIds",
  factionIds = "communityFactionIds",
  origin = "origin",
}

export default DhCommunityMetaField;

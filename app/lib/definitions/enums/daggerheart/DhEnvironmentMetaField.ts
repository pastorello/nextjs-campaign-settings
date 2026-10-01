/**
 * A Daggerheart environment's fields (SPEC-028). `tier` and `difficulty`
 * are shared with adversaries; the links are prefixed, as a community's are.
 */
enum DhEnvironmentMetaField {
  name = "name",
  description = "description",
  imageId = "imageId",
  tier = "tier",
  environmentType = "environmentType",
  impulses = "impulses",
  difficulty = "difficulty",
  adversaryIds = "environmentAdversaryIds",
  otherAdversaries = "otherAdversaries",
  placeIds = "environmentPlaceIds",
  origin = "origin",
}

export default DhEnvironmentMetaField;

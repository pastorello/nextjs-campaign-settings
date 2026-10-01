/**
 * A Daggerheart adversary's fields (SPEC-028). `tier` and `difficulty` are
 * shared with environments (and SPEC-029's equipment), declared once in
 * `pageMetaFields`; the type and the attack's fields are prefixed, since
 * magic items own `type` and spells a range.
 */
enum DhAdversaryMetaField {
  name = "name",
  description = "description",
  imageId = "imageId",
  tier = "tier",
  adversaryType = "adversaryType",
  hordeDensity = "hordeDensity",
  motives = "motives",
  difficulty = "difficulty",
  majorThreshold = "majorThreshold",
  severeThreshold = "severeThreshold",
  hp = "hp",
  stress = "stress",
  attackModifier = "attackModifier",
  attackName = "attackName",
  attackRange = "attackRange",
  attackDamage = "attackDamage",
  attackType = "attackType",
  origin = "origin",
}

export default DhAdversaryMetaField;

/**
 * A Daggerheart weapon's fields (SPEC-029). Keys that would collide in the
 * flat metadata namespace are prefixed and `@map`ped to the spec's columns:
 * spells own a range, adversaries an attack type, domain cards a feature
 * text. `tier` is SPEC-028's shared field.
 */
enum DhWeaponMetaField {
  name = "name",
  imageId = "imageId",
  tier = "tier",
  slot = "weaponSlot",
  trait = "weaponTrait",
  range = "weaponRange",
  damageDie = "damageDie",
  damageBonus = "damageBonus",
  damageType = "weaponDamageType",
  burden = "burden",
  featureName = "weaponFeatureName",
  featureText = "weaponFeatureText",
  origin = "origin",
}

export default DhWeaponMetaField;

import type RecordImageKeys from "@/app/lib/definitions/interfaces/images/RecordImageKeys";

/**
 * A Daggerheart weapon (SPEC-029 §5, `dhWeapon`). The vocabularies are
 * stored as strings: `weaponSlot` a `DhWeaponSlot`, `weaponTrait` a
 * `DhSpellcastTrait`, `weaponRange` a `DhRange`, `weaponDamageType` a
 * `DhDamageType`. `damageDie` is the die's size; the dice count is the
 * wielder's Proficiency. The feature is a name and a text, or neither.
 */
interface DhWeapon {
  id: number;
  name: string;
  tier: number;
  weaponSlot: string;
  weaponTrait: string;
  weaponRange: string;
  damageDie: number;
  damageBonus: number;
  weaponDamageType: string;
  burden: number;
  weaponFeatureName: string | null;
  weaponFeatureText: string | null;
  origin: string;
  /** A `recordImage` id, or `null` for none (SPEC-020 T3). */
  imageId?: number | null;
  /** The image's storage keys, when the read included them. */
  image?: RecordImageKeys | null;
}

export default DhWeapon;

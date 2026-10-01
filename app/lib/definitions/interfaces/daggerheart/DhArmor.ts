import type RecordImageKeys from "@/app/lib/definitions/interfaces/images/RecordImageKeys";

/**
 * A Daggerheart armor (SPEC-029 §5, `dhArmor`). Its thresholds are a base
 * the wearer's level raises; Major is below Severe. The feature is a name
 * and a text, or neither.
 */
interface DhArmor {
  id: number;
  name: string;
  tier: number;
  armorMajor: number;
  armorSevere: number;
  armorScore: number;
  armorFeatureName: string | null;
  armorFeatureText: string | null;
  origin: string;
  /** A `recordImage` id, or `null` for none (SPEC-020 T3). */
  imageId?: number | null;
  /** The image's storage keys, when the read included them. */
  image?: RecordImageKeys | null;
}

export default DhArmor;

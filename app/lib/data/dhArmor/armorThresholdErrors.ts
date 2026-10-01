import fieldError from "@/app/lib/data/validation/fieldError";
import DhArmorMetaField from "@/app/lib/definitions/enums/daggerheart/DhArmorMetaField";
import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";

/**
 * An armor's base Major threshold is below its Severe (SPEC-029 §5,
 * `daggerheart.md` §8), refused on Severe with SPEC-028's
 * `majorBelowSevere`. The table's CHECK holds the same rule.
 */
export default function armorThresholdErrors(
  major: number,
  severe: number
): FieldErrors | null {
  return major < severe
    ? null
    : { [DhArmorMetaField.severe]: [fieldError("majorBelowSevere")] };
}

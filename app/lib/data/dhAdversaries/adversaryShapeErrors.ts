import fieldError from "@/app/lib/data/validation/fieldError";
import DhAdversaryType from "@/app/lib/definitions/enums/daggerheart/DhAdversaryType";
import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";

/** The fields the cross-field rules read, as they would be stored. */
export interface AdversaryShape {
  adversaryType: string;
  hordeDensity: number | null;
  majorThreshold: number | null;
  severeThreshold: number | null;
}

/**
 * The rules no single field's validator can state (SPEC-028 §5, §9
 * decision 1), each refused on the field to change:
 *
 * - a horde has a density, and nothing else does;
 * - thresholds come as a pair, and only a minion may have none;
 * - Major is below Severe.
 *
 * The table's CHECKs hold the same rules; these give the DM the field
 * error the CHECK cannot.
 */
export default function adversaryShapeErrors(
  shape: AdversaryShape
): FieldErrors | null {
  const errors: FieldErrors = {};
  const isHorde = shape.adversaryType === (DhAdversaryType.Horde as string);
  const isMinion = shape.adversaryType === (DhAdversaryType.Minion as string);

  if (isHorde && shape.hordeDensity === null) {
    errors.hordeDensity = [fieldError("hordeNeedsDensity")];
  } else if (!isHorde && shape.hordeDensity !== null) {
    errors.hordeDensity = [fieldError("densityOnlyForHorde")];
  }

  const { majorThreshold: major, severeThreshold: severe } = shape;
  if (major === null && severe === null) {
    if (!isMinion) errors.majorThreshold = [fieldError("thresholdsRequired")];
  } else if (major === null) {
    errors.majorThreshold = [fieldError("thresholdsPair")];
  } else if (severe === null) {
    errors.severeThreshold = [fieldError("thresholdsPair")];
  } else if (major >= severe) {
    errors.severeThreshold = [fieldError("majorBelowSevere")];
  }

  return Object.keys(errors).length > 0 ? errors : null;
}

import campaignSystemFields, {
  type CampaignRow,
} from "@/app/lib/config/campaigns/campaignSystemFields";
import fieldError from "@/app/lib/data/validation/fieldError";
import { GAME_SYSTEMS } from "@/app/lib/definitions/GameSystem";
import type GameSystem from "@/app/lib/definitions/GameSystem";
import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";

/** Whether a payload value says anything: not missing, null, empty or off. */
const carriesValue = (value: unknown) =>
  value !== undefined &&
  value !== null &&
  value !== false &&
  value !== "" &&
  !(Array.isArray(value) && value.length === 0);

/**
 * Refuses, field by field, a write that sets another system's field on a
 * campaign row (SPEC-030 §5: "the scene's campaign decides which fields
 * exist"). An empty value is no setting, so a form may still send its
 * blanks; a value is refused with `notInThisSystem`.
 */
export default function otherSystemFieldErrors(
  row: CampaignRow,
  system: GameSystem,
  payload: object
): FieldErrors | null {
  const values = payload as Record<string, unknown>;
  const errors: FieldErrors = {};
  for (const other of GAME_SYSTEMS) {
    if (other === system) continue;
    for (const key of campaignSystemFields[row][other]) {
      if (carriesValue(values[key])) {
        errors[key] = [fieldError("notInThisSystem")];
      }
    }
  }
  return Object.keys(errors).length > 0 ? errors : null;
}

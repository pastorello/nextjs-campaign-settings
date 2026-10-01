import SelectOption from "@/app/lib/definitions/types/SelectOption";
import { DH_DICE } from "@/app/lib/utils/validators/diceExpressionValidator";

/**
 * A weapon's damage die (SPEC-029 §5), as select options: the die's size,
 * shown as `d8`. How many are rolled is the wielder's Proficiency, so it
 * is not stored. The `damageDie` CHECK is the same set.
 */
const dhDamageDice: SelectOption<number>[] = DH_DICE.map((sides) => ({
  value: sides,
  labelKey: `daggerheart.dice.d${sides}`,
}));

export default dhDamageDice;

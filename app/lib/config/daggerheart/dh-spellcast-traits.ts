import DhSpellcastTrait from "@/app/lib/definitions/enums/daggerheart/DhSpellcastTrait";
import SelectOption from "@/app/lib/definitions/types/SelectOption";

/**
 * The form's value for "this subclass does not cast". The column stores
 * `null` for it (SPEC-021 §6); `toStoredSpellcastTrait` maps it on the way
 * in, and the result schema's `defaultValue` fallback maps `null` back.
 */
export const NO_SPELLCAST_TRAIT = "none";

/** "None", then `DhSpellcastTrait`'s six traits in the spec's order. */
const dhSpellcastTraits: SelectOption<string>[] = [
  { value: NO_SPELLCAST_TRAIT, labelKey: "dhSubclasses.spellcastTraits.none" },
  ...Object.values(DhSpellcastTrait).map((trait) => ({
    value: trait,
    labelKey: `dhSubclasses.spellcastTraits.${trait}`,
  })),
];

export default dhSpellcastTraits;

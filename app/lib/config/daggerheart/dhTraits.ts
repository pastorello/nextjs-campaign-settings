import DhSpellcastTrait from "@/app/lib/definitions/enums/daggerheart/DhSpellcastTrait";
import SelectOption from "@/app/lib/definitions/types/SelectOption";

/**
 * The six traits (`daggerheart.md` §7) as select options, for a weapon
 * (SPEC-029 §9 decision 2). The subclass's list adds "none"; this one has
 * no such entry, since every weapon names a trait.
 */
const dhTraits: SelectOption<DhSpellcastTrait>[] = Object.values(
  DhSpellcastTrait
).map((trait) => ({
  value: trait,
  labelKey: `dhSubclasses.spellcastTraits.${trait}`,
}));

export default dhTraits;

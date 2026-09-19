import DhDomainCardType from "@/app/lib/definitions/enums/daggerheart/DhDomainCardType";
import SelectOption from "@/app/lib/definitions/types/SelectOption";

/** `DhDomainCardType`'s select options (SPEC-021 T3). */
const dhDomainCardTypes: SelectOption<DhDomainCardType>[] = [
  { value: DhDomainCardType.Ability, labelKey: "dhDomainCards.types.ability" },
  { value: DhDomainCardType.Spell, labelKey: "dhDomainCards.types.spell" },
  {
    value: DhDomainCardType.Grimoire,
    labelKey: "dhDomainCards.types.grimoire",
  },
];

export default dhDomainCardTypes;

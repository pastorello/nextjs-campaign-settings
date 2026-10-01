import DhDamageType from "@/app/lib/definitions/enums/daggerheart/DhDamageType";
import SelectOption from "@/app/lib/definitions/types/SelectOption";

/** The two damage types (SPEC-028 T1), as select options. */
const dhDamageTypes: SelectOption<DhDamageType>[] = [
  {
    value: DhDamageType.Physical,
    labelKey: "daggerheart.damageTypes.physical",
  },
  { value: DhDamageType.Magic, labelKey: "daggerheart.damageTypes.magic" },
];

export default dhDamageTypes;

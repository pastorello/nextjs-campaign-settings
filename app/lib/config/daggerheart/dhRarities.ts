import DhRarity from "@/app/lib/definitions/enums/daggerheart/DhRarity";
import SelectOption from "@/app/lib/definitions/types/SelectOption";

/** Loot's four rarities (SPEC-029 T1), as select options. */
const dhRarities: SelectOption<DhRarity>[] = [
  { value: DhRarity.Common, labelKey: "daggerheart.rarities.common" },
  { value: DhRarity.Uncommon, labelKey: "daggerheart.rarities.uncommon" },
  { value: DhRarity.Rare, labelKey: "daggerheart.rarities.rare" },
  { value: DhRarity.Legendary, labelKey: "daggerheart.rarities.legendary" },
];

export default dhRarities;

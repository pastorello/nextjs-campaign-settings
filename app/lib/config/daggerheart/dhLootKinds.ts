import DhLootKind from "@/app/lib/definitions/enums/daggerheart/DhLootKind";
import SelectOption from "@/app/lib/definitions/types/SelectOption";

/** Loot's two kinds (SPEC-029 T1), as select options. */
const dhLootKinds: SelectOption<DhLootKind>[] = [
  { value: DhLootKind.Item, labelKey: "daggerheart.lootKinds.item" },
  {
    value: DhLootKind.Consumable,
    labelKey: "daggerheart.lootKinds.consumable",
  },
];

export default dhLootKinds;

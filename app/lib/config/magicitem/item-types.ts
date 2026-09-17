import MagicItemType from "@/app/lib/definitions/enums/magicitem/MagicItemType";

interface MagicItemTypeObject {
  type: MagicItemType;
  value: number;
  labelKey: string;
}

const itemTypes: MagicItemTypeObject[] = [
  { value: 0, labelKey: "magicItems.types.ring", type: MagicItemType.Ring },
  {
    value: 1,
    labelKey: "magicItems.types.weapon",
    type: MagicItemType.Weapon,
  },
  {
    value: 2,
    labelKey: "magicItems.types.armor",
    type: MagicItemType.Armor,
  },
  {
    value: 3,
    labelKey: "magicItems.types.wand",
    type: MagicItemType.Wand,
  },
  {
    value: 4,
    labelKey: "magicItems.types.staff",
    type: MagicItemType.Staff,
  },
  {
    value: 5,
    labelKey: "magicItems.types.wondrousItem",
    type: MagicItemType.WondrousItem,
  },
  {
    value: 6,
    labelKey: "magicItems.types.scroll",
    type: MagicItemType.Scroll,
  },
  {
    value: 7,
    labelKey: "magicItems.types.potion",
    type: MagicItemType.Potion,
  },
  { value: 8, labelKey: "magicItems.types.rod", type: MagicItemType.Rod },
];

export default itemTypes;

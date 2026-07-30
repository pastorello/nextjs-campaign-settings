import MagicItemType from "@/app/lib/definitions/enums/magicitem/MagicItemType";

interface MagicItemTypeObject {
  type: MagicItemType;
  value: number;
  labelKey: string;
}

const itemTypes: MagicItemTypeObject[] = [
  { value: 0, labelKey: "magicItems.types.ring", type: MagicItemType.Anello },
  { value: 1, labelKey: "magicItems.types.weapon", type: MagicItemType.Arma },
  {
    value: 2,
    labelKey: "magicItems.types.armor",
    type: MagicItemType.Armatura,
  },
  {
    value: 3,
    labelKey: "magicItems.types.wand",
    type: MagicItemType.Bacchetta,
  },
  {
    value: 4,
    labelKey: "magicItems.types.staff",
    type: MagicItemType.Bastone,
  },
  {
    value: 5,
    labelKey: "magicItems.types.wondrousItem",
    type: MagicItemType.OggettoMeraviglioso,
  },
  {
    value: 6,
    labelKey: "magicItems.types.scroll",
    type: MagicItemType.Pergamena,
  },
  {
    value: 7,
    labelKey: "magicItems.types.potion",
    type: MagicItemType.Pozione,
  },
  { value: 8, labelKey: "magicItems.types.rod", type: MagicItemType.Verga },
];

export default itemTypes;

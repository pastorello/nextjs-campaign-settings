import Rarity from "@/app/lib/definitions/enums/magicitem/Rarity";

export interface RarityObject {
  type: Rarity;
  value: number;
  labelKey: string;
}

const rarity: RarityObject[] = [
  { value: 0, labelKey: "magicItems.rarity.common", type: Rarity.Common },
  { value: 1, labelKey: "magicItems.rarity.uncommon", type: Rarity.Uncommon },
  { value: 2, labelKey: "magicItems.rarity.rare", type: Rarity.Rare },
  {
    value: 3,
    labelKey: "magicItems.rarity.veryRare",
    type: Rarity.VeryRare,
  },
  {
    value: 4,
    labelKey: "magicItems.rarity.legendary",
    type: Rarity.Legendary,
  },
  {
    value: 5,
    labelKey: "magicItems.rarity.artifact",
    type: Rarity.Artifact,
  },
  {
    value: 6,
    labelKey: "magicItems.rarity.variable",
    type: Rarity.Variable,
  },
];

export default rarity;

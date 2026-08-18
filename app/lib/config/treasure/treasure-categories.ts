import TreasureCategory from "@/app/lib/definitions/enums/treasure/TreasureCategory";

interface TreasureCategoryObject {
  type: TreasureCategory;
  value: number;
  labelKey: string;
}

const treasureCategories: TreasureCategoryObject[] = [
  {
    value: 0,
    labelKey: "treasure.categories.coins",
    type: TreasureCategory.Coins,
  },
  {
    value: 1,
    labelKey: "treasure.categories.artObjects",
    type: TreasureCategory.ArtObjects,
  },
  {
    value: 2,
    labelKey: "treasure.categories.gems",
    type: TreasureCategory.Gems,
  },
  {
    value: 3,
    labelKey: "treasure.categories.tradeGoods",
    type: TreasureCategory.TradeGoods,
  },
];

export default treasureCategories;

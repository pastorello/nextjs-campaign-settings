/**
 * The four kinds of non-magical valuable in the treasure catalogue
 * (SPEC-013 §6: "coins, art objects, gems, trade goods"). `treasure.category`
 * is stored as an `Int`, "static options, like magicitems.type" — so this
 * follows `MagicItemType`'s exact shape: the enum here, paired with a
 * numeric options array in `app/lib/config/treasure/treasure-categories.ts`.
 * (`MagicItemType`'s members were Italian until TD-97's pure rename.)
 */
enum TreasureCategory {
  Coins = "Coins",
  ArtObjects = "ArtObjects",
  Gems = "Gems",
  TradeGoods = "TradeGoods",
}

export default TreasureCategory;

/**
 * TD-97: renamed from the original Italian identifiers (`Anello`, `Armatura`,
 * `Arma`, `Bacchetta`, `Bastone`, `OggettoMeraviglioso`, `Pergamena`,
 * `Pozione`, `Verga`) — a TD-33 miss. This is a code-layer rename only:
 * `magicitems.type` is stored as an `Int` (the `value` in
 * `app/lib/config/magicitem/item-types.ts`), never as this enum's string, so
 * nothing persisted changes and no migration is needed.
 */
enum MagicItemType {
  Ring = "Ring",
  Armor = "Armor",
  Weapon = "Weapon",
  Wand = "Wand",
  Staff = "Staff",
  WondrousItem = "WondrousItem",
  Scroll = "Scroll",
  Potion = "Potion",
  Rod = "Rod",
}

export default MagicItemType;

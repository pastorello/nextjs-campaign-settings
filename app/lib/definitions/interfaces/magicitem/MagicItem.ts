interface MagicItem {
  id: number;
  name: string;
  rarity: number;
  type: number;
  attuned: boolean;
  consumable: boolean;
  description: string;
  /** A `recordImage` id, or `null` for none (SPEC-020 T3). */
  imageId?: number | null;
}

export default MagicItem;

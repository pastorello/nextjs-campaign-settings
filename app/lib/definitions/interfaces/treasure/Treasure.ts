import type RecordImageKeys from "@/app/lib/definitions/interfaces/images/RecordImageKeys";

/**
 * A treasure catalogue entry: the seventh domain, "same shape as
 * magicitems" (SPEC-013 §6). Mirrors `MagicItem`'s shape exactly, including
 * keeping `category` a raw `number` rather than the `TreasureCategory` enum
 * type — `magicitems.rarity`/`.type` do the same, since the option-array
 * indirection (`treasure-categories.ts`) is what actually maps the stored
 * `Int` to the enum, not the interface itself.
 */
interface Treasure {
  id: number;
  name: string;
  description: string | null;
  category: number;
  value: number | null;
  /** A `recordImage` id, or `null` for none (SPEC-020 T3). */
  imageId?: number | null;
  /** The image's storage keys, when the read included them (SPEC-020 T4). */
  image?: RecordImageKeys | null;
}

export default Treasure;

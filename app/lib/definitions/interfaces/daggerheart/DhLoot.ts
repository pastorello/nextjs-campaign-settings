import type RecordImageKeys from "@/app/lib/definitions/interfaces/images/RecordImageKeys";

/**
 * A piece of Daggerheart loot (SPEC-029 §5, `dhLoot`). `lootKind` is a
 * `DhLootKind`, `lootRarity` a `DhRarity`. The roll value is the entry it
 * answers to on the DM's own table, or none.
 */
interface DhLoot {
  id: number;
  name: string;
  lootKind: string;
  lootRarity: string;
  rollValue: number | null;
  /** Formatted text (SPEC-019). */
  effectText: string;
  origin: string;
  /** A `recordImage` id, or `null` for none (SPEC-020 T3). */
  imageId?: number | null;
  /** The image's storage keys, when the read included them. */
  image?: RecordImageKeys | null;
}

export default DhLoot;

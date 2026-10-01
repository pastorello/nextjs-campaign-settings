/**
 * What a scene gives up (SPEC-013 §6) — outside the metadata layer
 * (ADR-0011), same reasoning as `Scene`. Named `loot`, not `treasure`:
 * `treasure` is the catalogue a loot row can optionally point at.
 * `magicItemId` and `treasureId` are mutually exclusive, enforced by the
 * validator (T6), never both set.
 */
interface Loot {
  id: number;
  sceneId: number;
  position: number;
  description: string;
  quantity: number;
  value: number | null;
  taken: boolean;
  magicItemId: number | null;
  treasureId: number | null;
  /**
   * SPEC-030, Daggerheart only: gold in handfuls and the catalogue link.
   * Optional so a 5e row need not carry them.
   */
  gold?: number | null;
  dhWeaponId?: number | null;
  dhArmorId?: number | null;
  dhLootId?: number | null;
}

export default Loot;

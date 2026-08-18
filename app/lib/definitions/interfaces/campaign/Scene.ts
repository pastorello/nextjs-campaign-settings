import SceneKind from "@/app/lib/definitions/enums/campaign/SceneKind";

/**
 * A scene within an adventure (SPEC-013 §6). Outside the metadata layer
 * (ADR-0011) — an ordered collection edited inline on the adventure page —
 * so this is a plain flat interface mirroring the `scene` table directly,
 * `createdAt`/`updatedAt` included, rather than the `Deity`/`NpcItem`-style
 * shape keyed by a `MetaField` enum.
 */
interface Scene {
  id: number;
  adventureId: number;
  position: number;
  kind: SceneKind;
  title: string;
  description: string | null;
  xpAward: number | null;
  grantsHeroPoint: boolean;
  awarded: boolean;
  zoneId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export default Scene;

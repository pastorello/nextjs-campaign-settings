/**
 * A creature row within a scene (SPEC-013 §6) — outside the metadata layer
 * (ADR-0011), same reasoning as `Scene`. The creature's XP total is derived
 * at read time as `xpEach * quantity`, never stored.
 */
interface SceneCreature {
  id: number;
  sceneId: number;
  position: number;
  name: string;
  level: number | null;
  xpEach: number | null;
  quantity: number;
  note: string | null;
  awarded: boolean;
  npcId: number | null;
}

export default SceneCreature;

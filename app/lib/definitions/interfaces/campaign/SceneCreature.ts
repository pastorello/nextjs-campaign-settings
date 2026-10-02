import type { ChallengeRating } from "@/app/lib/config/dnd5e/challengeRatings";

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
  /** SPEC-030, Daggerheart only: the adversary the row prices. */
  dhAdversaryId?: number | null;
  /** SPEC-031, any system: an http/https link to the creature's statistics. */
  statsUrl?: string | null;
  /** SPEC-031, 5e only: one of `CHALLENGE_RATINGS`. */
  challengeRating?: ChallengeRating | null;
}

export default SceneCreature;

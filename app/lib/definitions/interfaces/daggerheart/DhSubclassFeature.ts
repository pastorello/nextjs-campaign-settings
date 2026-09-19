import type DhSubclassFeatureTier from "@/app/lib/definitions/enums/daggerheart/DhSubclassFeatureTier";

/**
 * One of a subclass's features (SPEC-021 §6, `dhSubclassFeature`), ordered
 * within its tier.
 */
interface DhSubclassFeature {
  id: number;
  subclassId: number;
  tier: DhSubclassFeatureTier;
  position: number;
  name: string;
  /** Formatted text (SPEC-019). */
  text: string;
}

export default DhSubclassFeature;

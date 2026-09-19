import type DhClassFeature from "./DhClassFeature";

/**
 * A Daggerheart class (SPEC-021 §5.4, `dhClass`). The Hope feature always
 * costs 3 Hope, so the cost is not a field.
 */
interface DhClass {
  id: number;
  name: string;
  description: string | null;
  domainAId: number | null;
  domainBId: number | null;
  startingEvasion: number;
  startingHp: number;
  classItems: string | null;
  hopeFeatureName: string;
  hopeFeatureText: string;
  origin: string;
  /** Read beside the scalar fields for the inline editor; never written. */
  features?: DhClassFeature[];
}

export default DhClass;

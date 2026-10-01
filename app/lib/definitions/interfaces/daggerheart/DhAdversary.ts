import type RecordImageKeys from "@/app/lib/definitions/interfaces/images/RecordImageKeys";

import type DhAdversaryExperience from "./DhAdversaryExperience";
import type DhAdversaryFeature from "./DhAdversaryFeature";

/**
 * A Daggerheart adversary's stat block (SPEC-028 §5, `dhAdversary`). The
 * vocabularies are stored as strings: `adversaryType` a `DhAdversaryType`,
 * `attackRange` a `DhRange`, `attackType` a `DhDamageType`, `origin` a
 * `DhOrigin`. A minion's thresholds may be `null`; only a horde has a
 * density.
 */
interface DhAdversary {
  id: number;
  name: string;
  description: string | null;
  tier: number;
  adversaryType: string;
  hordeDensity: number | null;
  motives: string | null;
  difficulty: number;
  majorThreshold: number | null;
  severeThreshold: number | null;
  hp: number;
  stress: number;
  attackModifier: number;
  attackName: string;
  attackRange: string;
  attackDamage: string;
  attackType: string;
  origin: string;
  /** A `recordImage` id, or `null` for none (SPEC-020 T3). */
  imageId?: number | null;
  /** The image's storage keys, when the read included them. */
  image?: RecordImageKeys | null;
  /** Read beside the fields for the inline editors; never written. */
  experiences?: DhAdversaryExperience[];
  features?: DhAdversaryFeature[];
}

export default DhAdversary;

import type RecordImageKeys from "@/app/lib/definitions/interfaces/images/RecordImageKeys";

import type DhEnvironmentFeature from "./DhEnvironmentFeature";

/**
 * A Daggerheart environment's stat block (SPEC-028 §5, `dhEnvironment`).
 * `environmentType` is a `DhEnvironmentType`, `origin` a `DhOrigin`. Its
 * potential adversaries are links to the bestiary plus a free-text line;
 * its places are links into the shared world.
 */
interface DhEnvironment {
  id: number;
  name: string;
  description: string | null;
  tier: number;
  environmentType: string;
  impulses: string | null;
  difficulty: number;
  otherAdversaries: string | null;
  origin: string;
  /** The form's link ids. */
  environmentAdversaryIds?: number[];
  environmentPlaceIds?: number[];
  /** A `recordImage` id, or `null` for none (SPEC-020 T3). */
  imageId?: number | null;
  /** The image's storage keys, when the read included them. */
  image?: RecordImageKeys | null;
  /** The linked records, named for the stat block; never written. */
  adversaries?: { id: number; name: string }[];
  places?: { id: number; name: string }[];
  /** Read beside the fields for the inline editor; never written. */
  features?: DhEnvironmentFeature[];
}

export default DhEnvironment;

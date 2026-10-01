import type RecordImageKeys from "@/app/lib/definitions/interfaces/images/RecordImageKeys";
import type DhCommunityLink from "./DhCommunityLink";

/**
 * A Daggerheart community (SPEC-027): where and among whom a character grew
 * up, with one feature, rooted in the shared world's places and factions.
 * `origin` is a `DhOrigin` value.
 */
interface DhCommunity {
  id: number;
  name: string;
  description: string | null;
  adjectives: string | null;
  communityFeatureName: string;
  communityFeatureText: string;
  /** The linked places' ids: the form's multiselect. */
  communityPlaceIds: number[];
  /** The linked factions' ids: the form's multiselect. */
  communityFactionIds: number[];
  origin: string;
  /** The linked places, named, when the read included them. */
  places?: DhCommunityLink[];
  /** The linked factions, named, when the read included them. */
  factions?: DhCommunityLink[];
  /** A `recordImage` id, or `null` for none (SPEC-020 T3). */
  imageId?: number | null;
  /** The image's storage keys, when the read included them. */
  image?: RecordImageKeys | null;
}

export default DhCommunity;

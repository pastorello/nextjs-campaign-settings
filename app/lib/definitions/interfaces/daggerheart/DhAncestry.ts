import type RecordImageKeys from "@/app/lib/definitions/interfaces/images/RecordImageKeys";

/**
 * A Daggerheart ancestry (SPEC-027): what a character is, with exactly two
 * features. The feature keys are prefixed in code and `@map`ped to the
 * `featureA*`/`featureB*` columns. `origin` is a `DhOrigin` value.
 */
interface DhAncestry {
  id: number;
  name: string;
  description: string | null;
  ancestryFeatureAName: string;
  ancestryFeatureAText: string;
  ancestryFeatureBName: string;
  ancestryFeatureBText: string;
  origin: string;
  /** A `recordImage` id, or `null` for none (SPEC-020 T3). */
  imageId?: number | null;
  /** The image's storage keys, when the read included them. */
  image?: RecordImageKeys | null;
}

export default DhAncestry;

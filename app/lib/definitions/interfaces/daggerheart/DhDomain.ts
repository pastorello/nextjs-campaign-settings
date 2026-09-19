import type RecordImageKeys from "@/app/lib/definitions/interfaces/images/RecordImageKeys";

/**
 * A Daggerheart domain (SPEC-021 T2). `colour` is a `DhDomainColour` key and
 * `origin` a `DhOrigin` value, kept as `string` like `Treasure.category` is
 * kept a `number`: the result schema checks membership, the interface does
 * not restate it.
 */
interface DhDomain {
  id: number;
  name: string;
  description: string | null;
  colour: string;
  origin: string;
  /** The emblem: a `recordImage` id, or `null` for none (SPEC-020 T3). */
  imageId?: number | null;
  /** The emblem's storage keys, when the read included them (SPEC-020 T4). */
  image?: RecordImageKeys | null;
}

export default DhDomain;

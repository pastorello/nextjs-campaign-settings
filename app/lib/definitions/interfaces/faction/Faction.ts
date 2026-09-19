import type RecordImageKeys from "@/app/lib/definitions/interfaces/images/RecordImageKeys";

interface Faction {
  id: number;
  name: string;
  description: string;
  /** A `recordImage` id, or `null` for none (SPEC-020 T3). */
  imageId?: number | null;
  /** The image's storage keys, when the read included them (SPEC-020 T4). */
  image?: RecordImageKeys | null;
}

export default Faction;

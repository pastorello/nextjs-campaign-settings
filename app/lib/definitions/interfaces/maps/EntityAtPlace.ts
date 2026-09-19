import type RecordImageKeys from "@/app/lib/definitions/interfaces/images/RecordImageKeys";
import type { LinkableEntityType } from "@/app/modules/maps/types/poi";

/**
 * One row in a place's popover entity list (SPEC-016 T1, §5) — id/name
 * paired with which table it came from, since detaching calls
 * `npc/assignLocation` or `deities/assignLocation` depending on `type`.
 * `image` is the portrait's keys (SPEC-020 T5), `null` when there is none.
 */
interface EntityAtPlace {
  id: number;
  name: string;
  type: LinkableEntityType;
  image: RecordImageKeys | null;
}

export default EntityAtPlace;

import { z } from "zod";

import zoneMeta from "@/app/lib/config/geography/zoneMeta";
import { NAVIGABLE_PLACE_KINDS } from "@/app/modules/maps/constants/place-kinds";

/**
 * A place created from a place picker (SPEC-026): a name, a parent and a
 * type, nothing else — no position, no map, no footprint (§3). The type is
 * a landmark (`"poi"`) or one of the navigable kinds, chosen in the dialog
 * with the landmark preselected (the DM's answer of 2026-09-30).
 *
 * `title` reuses `zoneMeta`'s validator, as `placeSchema` and
 * `buildPoiCreateSchema` do (TD-129): both tables' titles follow the same
 * rule. `parentId` is nullable here so that its absence is refused with the
 * data layer's own `placeNeedsParent`, not a generic type error — §5: never
 * silently the root.
 */
export const pickerPlaceSchema = z.object({
  title: zoneMeta.title.validator,
  parentId: z.coerce.number().int().positive().nullable(),
  kind: z.enum(["poi", ...NAVIGABLE_PLACE_KINDS]),
});

export type PickerPlaceInput = z.infer<typeof pickerPlaceSchema>;

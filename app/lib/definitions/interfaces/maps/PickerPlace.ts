import type FieldErrors from "@/app/lib/definitions/types/FieldErrors";

/**
 * What `createPlaceFromPicker` hands back (SPEC-026): enough for the picker
 * that opened the dialog to select the new place. A landmark lives in
 * `poi` and is selected as the landmark of its parent zone; any other kind
 * lives in `zone` and is selected as the zone itself.
 */
export interface PickerPlace {
  kind: "poi" | "zone";
  id: number;
  parentId: number;
}

export type PickerPlaceResult =
  { ok: true; place: PickerPlace } | { ok: false; errors: FieldErrors };

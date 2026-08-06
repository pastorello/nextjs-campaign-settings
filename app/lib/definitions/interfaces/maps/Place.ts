/**
 * `createPlace`'s return type (SPEC-004 §10 M5) — mirrors `PoiCreateResult`:
 * the caller needs the new row's id back for the same reason `usePOIManager`
 * does, even though M5 doesn't wire up optimistic client state for
 * region/deity/npc kinds.
 */
export type CreatePlaceResult =
  | { ok: true; id: number }
  | { ok: false; errors: Record<string, string[] | undefined> };

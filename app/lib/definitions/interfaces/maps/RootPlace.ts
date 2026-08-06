/**
 * The tree's single root — a `poi` row with `kind: "region"` and no parent
 * (SPEC-004 §5.1/§10 M4). Only the fields the "create your world" flow
 * actually needs, not the full `poi` row shape.
 */
interface RootPlace {
  id: number;
  title: string;
  mapImage: string;
}

export default RootPlace;

/** Payload for `createRootPlace`. */
export interface CreateRootPlaceInput {
  title: string;
  mapImage: string;
}

/**
 * `createRootPlace`'s return type. Unlike `poi.ts`'s `PoiCreateResult`, the
 * caller doesn't need the new id back — there's nothing to reconcile against
 * (no optimistic client state, unlike `usePOIManager`) — so success only
 * confirms the write happened.
 */
export type CreateRootPlaceResult =
  { ok: true } | { ok: false; errors: Record<string, string[] | undefined> };

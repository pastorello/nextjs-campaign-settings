/**
 * A POI as persisted (TD-14 / SPEC-002, reshaped by SPEC-008 T8) — matches
 * `prisma.poi`'s row shape exactly. Landmark-only since T8: every row
 * belongs to exactly one Zone (`zoneId`), and the `linkedType`/`linkedId`
 * optional link to an NPC/deity (TD-14) was removed along with the columns
 * — superseded by `npc`/`deities`' own `zoneId`/`poiId` (the entity now
 * points at its location, not the other way around).
 */
interface Poi {
  id: number;
  title: string;
  description: string | null;
  // SPEC-010 T1 — nullable so a landmark can survive its zone's deletion
  // unpositioned, the same state a place has always been able to be in.
  lat: number | null;
  lng: number | null;
  category: string;
  zoneId: number;
  createdAt: Date;
  updatedAt: Date;
}

export default Poi;

/**
 * Payload for `createPoi`: everything but the server-assigned id and
 * timestamps. `zoneId` is required — a landmark always belongs to exactly
 * one zone (§6).
 */
export interface PoiCreateInput {
  title: string;
  description?: string;
  lat: number;
  lng: number;
  category: string;
  zoneId: number;
}

/** Payload for `updatePoi`: only `id` is required. */
export interface PoiUpdateInput extends Partial<PoiCreateInput> {
  id: number;
}

/**
 * `createPoi`'s return type. Unlike the other domains' `MutationResult`,
 * success carries the new row's id: `usePOIManager` places an optimistic
 * marker under a temporary client-generated id and must swap it for the
 * real one once the write lands (SPEC-002 §9, "id reconciliation").
 */
export type PoiCreateResult =
  | { ok: true; id: number }
  | { ok: false; errors: Record<string, string[] | undefined> };

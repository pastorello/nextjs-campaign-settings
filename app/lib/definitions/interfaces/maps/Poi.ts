import type { LinkableEntityType } from "@/app/modules/maps/types/poi";

/**
 * A POI as persisted (TD-14 / SPEC-002) — matches `prisma.poi`'s row shape
 * exactly, including nullable columns read back as `null`, not `undefined`.
 */
interface Poi {
  id: number;
  title: string;
  description: string | null;
  lat: number;
  lng: number;
  category: string;
  linkedType: LinkableEntityType | null;
  linkedId: number | null;
  // SPEC-004 M7: which place this pin is a child of. Null for a POI created
  // before the tree existed, or (in principle) one created outside it.
  parentId: number | null;
  createdAt: Date;
  updatedAt: Date;
}

export default Poi;

/**
 * Payload for `createPoi`: everything but the server-assigned id and
 * timestamps. `linkedType`/`linkedId` are optional — a POI need not link to
 * anything. `parentId` is optional for the same reason: not every caller of
 * `createPoi` is scoped to a tree place.
 */
export interface PoiCreateInput {
  title: string;
  description?: string;
  lat: number;
  lng: number;
  category: string;
  linkedType?: LinkableEntityType | null;
  linkedId?: number | null;
  parentId?: number | null;
}

/**
 * Payload for `updatePoi`: only `id` is required. `linkedType`/`linkedId`
 * carry three states each — omitted (leave the link as-is), `null` (clear
 * it), or a value (set it) — see `poiSchema.ts`'s `hasPairedLink`.
 */
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

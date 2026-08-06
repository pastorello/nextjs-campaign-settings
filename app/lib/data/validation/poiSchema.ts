import { z } from "zod";

import { POI_CATEGORIES } from "@/app/modules/maps/constants/poi-categories";
import { LINKABLE_ENTITY_TYPES } from "@/app/modules/maps/constants/linkable-entities";
import type {
  POICategory,
  LinkableEntityType,
} from "@/app/modules/maps/types/poi";

// Derived from the runtime lists rather than repeating the unions as string
// literals, so the two cannot drift apart (same pattern as
// `poiGeoJSONSchema` in `app/modules/maps/types/poiSchema.ts`).
const categoryIds = POI_CATEGORIES.map((c) => c.id) as [
  POICategory,
  ...POICategory[],
];
const linkableTypeIds = LINKABLE_ENTITY_TYPES.map((t) => t.id) as [
  LinkableEntityType,
  ...LinkableEntityType[],
];

const poiFields = {
  title: z.string().min(1),
  description: z.string().optional(),
  // `finite()`, not Earth's ±90/±180. These maps are image overlays, not a
  // globe: `app/[locale]/dashboard/geography/page.tsx` declares bounds like
  // `[[0, 0], [1000, 1333]]`, so a marker's "lat"/"lng" are pixel-space
  // coordinates that routinely run into the hundreds. Geographic bounds were
  // the first thing written here and they rejected every POI the app can
  // actually place — caught by a round-trip against the real database, not
  // by the unit tests, whose fixtures happened to sit inside both ranges.
  // Each map declares its own bounds and Leaflet already clamps to them, so
  // the boundary's job here is only to reject what is not a number at all.
  lat: z.number().finite(),
  lng: z.number().finite(),
  category: z.enum(categoryIds),
  linkedType: z.enum(linkableTypeIds).nullable().optional(),
  linkedId: z.coerce.number().int().positive().nullable().optional(),
  // SPEC-004 M7: which tree place this POI is a child of. Optional — a POI
  // created outside the tree (or before it existed) has none.
  parentId: z.coerce.number().int().positive().nullable().optional(),
};

/**
 * `linkedType` and `linkedId` are a polymorphic pair (SPEC-002 §6): a POI
 * links to at most one entity, of exactly one type. Neither field alone
 * means anything, so both must be present or both absent — never a
 * half-link naming a type with no id, or an id with no type to resolve it
 * against.
 *
 * Both are `.nullable()`, not just `.optional()`, because Prisma tells
 * "leave this column alone" (`undefined`) apart from "set it to NULL"
 * (`null`) — and only the latter can clear an existing link on update.
 * `absent(x)` treats `undefined` and `null` as the same "no value" for the
 * pairing check; which one a caller sends only matters to Prisma, not to
 * whether the pair is well-formed.
 */
function absent(value: unknown): boolean {
  return value === undefined || value === null;
}

function hasPairedLink(data: {
  linkedType?: LinkableEntityType | null | undefined;
  linkedId?: number | null | undefined;
}) {
  return absent(data.linkedType) === absent(data.linkedId);
}

const linkPairIssue = {
  message:
    "linkedType and linkedId must both be present or both be absent — a POI links to at most one entity.",
  path: ["linkedType"],
};

/**
 * Full-object schema for a create payload (TD-14 / SPEC-002).
 */
export function buildPoiCreateSchema() {
  return z.object(poiFields).refine(hasPairedLink, linkPairIssue);
}

/**
 * Schema for an update payload: every field optional except `id`, since an
 * update only carries the fields the user edited — mirrors
 * `buildEntitySchema.buildUpdateSchema`, which POI does not use directly
 * because it sits outside the metadata layer (SPEC-002 §7).
 */
export function buildPoiUpdateSchema() {
  return z
    .object(poiFields)
    .partial()
    .extend({ id: z.coerce.number().int().positive() })
    .refine(hasPairedLink, linkPairIssue);
}

import { z } from "zod";

import { POI_CATEGORIES } from "@/app/modules/maps/constants/poi-categories";
import { NAVIGABLE_PLACE_KINDS } from "@/app/modules/maps/constants/place-kinds";
import type { POICategory } from "@/app/modules/maps/types/poi";

// Derived from the runtime list rather than repeating the union as string
// literals, so the two cannot drift apart — same pattern as `poiSchema.ts`.
const categoryIds = POI_CATEGORIES.map((c) => c.id) as [
  POICategory,
  ...POICategory[],
];

const coordinatePair = z.tuple([z.number(), z.number()]);

/**
 * Fields every kind shares. `parentId` is not kind-specific — every place
 * (other than the single universe root, created outside this schema in M4)
 * has one — so it lives here rather than in a per-kind variant.
 */
const commonFields = {
  title: z.string().min(1),
  description: z.string().optional(),
  lat: z.number().finite(),
  lng: z.number().finite(),
  parentId: z.coerce.number().int().positive().nullable().optional(),
};

/**
 * Every field a kind does *not* carry must be either absent or explicitly
 * `undefined` — `z.undefined().optional()` accepts a missing key (Zod
 * treats bare `z.undefined()` as requiring the key present-but-`undefined`,
 * which a plain omitted key does not satisfy) while still rejecting a
 * `deity` payload that also sets `mapImage`, with a field-level error on
 * `mapImage` itself — what SPEC-004 §5.1's table means by "a deity with a
 * map ... rejected".
 */
const noneOfTheOthers = {
  category: z.undefined().optional(),
  linkedType: z.undefined().optional(),
  linkedId: z.undefined().optional(),
  mapImage: z.undefined().optional(),
  mapBounds: z.undefined().optional(),
  mapInitialView: z.undefined().optional(),
  mapInitialZoom: z.undefined().optional(),
};

/**
 * `region`, `plane`, `city` and `dungeon` (SPEC-004 T2) share one shape — a
 * bigger place containing smaller ones, distinguished only by `kind` itself,
 * so one schema variant validates all four rather than repeating it per
 * kind.
 */
const navigableSchema = z.object({
  ...commonFields,
  ...noneOfTheOthers,
  kind: z.enum(NAVIGABLE_PLACE_KINDS),
  mapImage: z.string().min(1),
  mapBounds: z.tuple([coordinatePair, coordinatePair]).optional(),
  mapInitialView: coordinatePair.optional(),
  mapInitialZoom: z.number().int().optional(),
});

const poiSchema = z.object({
  ...commonFields,
  ...noneOfTheOthers,
  kind: z.literal("poi"),
  category: z.enum(categoryIds),
});

/**
 * The discriminated union of SPEC-004 §5.1's table (plus T2's richer
 * vocabulary). `kind: "deity"`/`"npc"` variants existed here until SPEC-008
 * T5 removed them: the map no longer creates a new pin for an entity, only
 * attaches an existing one to a place that already exists (§5) — `kind`
 * decides which other fields are required, forbidden, or optional among
 * what remains.
 */
export const placeSchema = z.discriminatedUnion("kind", [
  navigableSchema,
  poiSchema,
]);

export type PlaceInput = z.infer<typeof placeSchema>;

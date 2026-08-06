import { z } from "zod";

import { POI_CATEGORIES } from "@/app/modules/maps/constants/poi-categories";
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

const regionSchema = z.object({
  ...commonFields,
  ...noneOfTheOthers,
  kind: z.literal("region"),
  mapImage: z.string().min(1),
  mapBounds: z.tuple([coordinatePair, coordinatePair]).optional(),
  mapInitialView: coordinatePair.optional(),
  mapInitialZoom: z.number().int().optional(),
});

const deitySchema = z.object({
  ...commonFields,
  ...noneOfTheOthers,
  kind: z.literal("deity"),
  linkedType: z.literal("deity"),
  linkedId: z.coerce.number().int().positive(),
});

const npcSchema = z.object({
  ...commonFields,
  ...noneOfTheOthers,
  kind: z.literal("npc"),
  linkedType: z.literal("npc"),
  linkedId: z.coerce.number().int().positive(),
});

const poiSchema = z.object({
  ...commonFields,
  ...noneOfTheOthers,
  kind: z.literal("poi"),
  category: z.enum(categoryIds),
});

/**
 * The discriminated union of SPEC-004 §5.1's table: `kind` decides which
 * other fields are required, forbidden, or optional. Not yet called from
 * `createPoi`/`updatePoi` — M5 wires this in once `MapPOIPanel` sends
 * `kind` in its payload; `PLACE_KINDS` (the closed vocabulary this union's
 * `kind` literals implement) is unused until then too.
 */
export const placeSchema = z.discriminatedUnion("kind", [
  regionSchema,
  deitySchema,
  npcSchema,
  poiSchema,
]);

export type PlaceInput = z.infer<typeof placeSchema>;

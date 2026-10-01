import z from "zod";

/** Which place, for its reveals (SPEC-022 T6b). */
export const placeRefSchema = z.object({
  kind: z.enum(["zone", "poi"]),
  id: z.number().int().positive(),
});
export type PlaceRefInput = z.input<typeof placeRefSchema>;

/** Reveal one place to one campaign, or hide it from it. */
export const setPlaceRevealSchema = placeRefSchema.extend({
  campaignId: z.number().int().positive(),
  revealed: z.boolean(),
});
export type SetPlaceRevealInput = z.input<typeof setPlaceRevealSchema>;

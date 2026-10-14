import z from "zod";

/** An adventure and the campaign it is copied into (`null` = standalone). */
export const copyAdventureSchema = z.object({
  adventureId: z.number().int().positive(),
  destinationCampaignId: z.number().int().positive().nullable(),
});
export type CopyAdventureInput = z.input<typeof copyAdventureSchema>;
